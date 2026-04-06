import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Match {
    id?: number;
    activity_id: number;
    date: string;
    opponent: string;
    result: 'Won' | 'Lost' | 'Draw' | 'Participation';
    level: 'School' | 'Zonal' | 'District' | 'Provincial' | 'National';
    score_team?: number;
    score_opponent?: number;
    location?: string;
    notes?: string;
}

export interface Achievement {
    id?: number;
    student_id: number;
    activity_id?: number | null;
    match_id?: number | null;
    title: string;
    description?: string;
    date: string;
    merit_points: number;
    type: 'Match_Award' | 'Season_Award' | 'Special_Recognition' | 'Participation' | 'Attendance';
}

// ── Match CRUD ────────────────────────────────────────────────────────────────

export const createMatch = async (match: Match): Promise<number> => {
    const { activity_id, date, opponent, result, level, score_team, score_opponent, location, notes } = match;
    // Try with level column first, fall back without it
    try {
        const [res] = await pool.query<OkPacket>(
            'INSERT INTO sports_matches (activity_id, date, opponent, result, level, score_team, score_opponent, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [activity_id, date, opponent, result, level ?? 'School', score_team ?? null, score_opponent ?? null, location ?? null, notes ?? null]
        );
        return res.insertId;
    } catch (e: any) {
        if (e.message.includes("Unknown column 'level'")) {
            const [res] = await pool.query<OkPacket>(
                'INSERT INTO sports_matches (activity_id, date, opponent, result, score_team, score_opponent, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [activity_id, date, opponent, result, score_team ?? null, score_opponent ?? null, location ?? null, notes ?? null]
            );
            return res.insertId;
        }
        throw e;
    }
};

export const getMatches = async (activityId?: number): Promise<Match[]> => {
    let query = 'SELECT * FROM sports_matches WHERE 1=1';
    const params: any[] = [];
    if (activityId) { query += ' AND activity_id = ?'; params.push(activityId); }
    query += ' ORDER BY date DESC';
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Match[];
};


export const updateMatchResult = async (id: number, updates: Partial<Match>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.result !== undefined) { fields.push('result = ?'); values.push(updates.result); }
    if (updates.level !== undefined) { fields.push('level = ?'); values.push(updates.level); }
    if (updates.score_team !== undefined) { fields.push('score_team = ?'); values.push(updates.score_team); }
    if (updates.score_opponent !== undefined) { fields.push('score_opponent = ?'); values.push(updates.score_opponent); }
    if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
    if (fields.length === 0) return;
    values.push(id);
    await pool.query(`UPDATE sports_matches SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteMatch = async (id: number): Promise<void> => {
    try { await pool.query('DELETE FROM sports_match_participants WHERE match_id = ?', [id]); } catch(_) {}
    try { await pool.query('DELETE FROM sports_achievements WHERE match_id = ?', [id]); } catch(_) {}
    await pool.query('DELETE FROM sports_matches WHERE id = ?', [id]);
};

// ── Match Participants ────────────────────────────────────────────────────────

export const setMatchParticipants = async (matchId: number, studentIds: number[]): Promise<void> => {
    try { await pool.query('DELETE FROM sports_match_participants WHERE match_id = ?', [matchId]); } catch(_) {}
    if (studentIds.length === 0) return;
    const values = studentIds.map(sid => [matchId, sid]);
    try {
        await pool.query('INSERT INTO sports_match_participants (match_id, student_id) VALUES ?', [values]);
    } catch(_) {
        // Table might not exist yet — silently skip
    }
};

export const getMatchParticipants = async (matchId: number): Promise<number[]> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT student_id FROM sports_match_participants WHERE match_id = ?', [matchId]
        );
        return rows.map(r => r.student_id);
    } catch(_) { return []; }
};

// ── Points Matrix ─────────────────────────────────────────────────────────────

const POINTS_MATRIX: Record<string, Record<string, number>> = {
    National:   { Won: 75, Lost: 10, Draw: 10, Participation: 15 },
    Provincial: { Won: 50, Lost: 8,  Draw: 8,  Participation: 12 },
    District:   { Won: 30, Lost: 6,  Draw: 6,  Participation: 10 },
    Zonal:      { Won: 20, Lost: 5,  Draw: 5,  Participation: 10 },
    School:     { Won: 10, Lost: 3,  Draw: 3,  Participation: 5  },
};

export const getMatchPoints = (level: string, result: string): number =>
    (POINTS_MATRIX[level]?.[result]) ?? 5;

export const awardMatchPoints = async (matchId: number): Promise<void> => {
    const [matchRows] = await pool.query<RowDataPacket[]>('SELECT * FROM sports_matches WHERE id = ?', [matchId]);
    if (matchRows.length === 0) return;
    const match = matchRows[0];

    const participants = await getMatchParticipants(matchId);
    if (participants.length === 0) return;

    const level = (match.level || 'School') as string;
    const result = match.result as string;
    const points = getMatchPoints(level, result);

    try {
        await pool.query("DELETE FROM sports_achievements WHERE match_id = ? AND type IN ('Match_Award','Participation')", [matchId]);
    } catch(_) {}

    const title = `${level} ${result}`;
    const description = `vs ${match.opponent} on ${match.date}`;
    const type = result === 'Won' ? 'Match_Award' : 'Participation';

    const rows = participants.map(sid => [sid, match.activity_id, matchId, title, description, match.date, points, type]);
    await pool.query(
        'INSERT INTO sports_achievements (student_id, activity_id, match_id, title, description, date, merit_points, type) VALUES ?',
        [rows]
    );
};

// ── Attendance Points ─────────────────────────────────────────────────────────

export const recalcAttendancePoints = async (studentId: number, activityId: number): Promise<number> => {
    const [totalRows] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as cnt FROM sports_practice_sessions WHERE activity_id = ?', [activityId]
    );
    const total = Number(totalRows[0].cnt);
    if (total === 0) return 0;

    const [presentRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM sports_attendance a
         JOIN sports_practice_sessions s ON a.session_id = s.id
         WHERE s.activity_id = ? AND a.student_id = ? AND a.status = 'Present'`,
        [activityId, studentId]
    );
    const present = Number(presentRows[0].cnt);
    const attPct = (present / total) * 100;
    const points = Math.round(attPct * 0.2 * 10) / 10;

    await pool.query(
        `DELETE FROM sports_achievements WHERE student_id = ? AND activity_id = ? AND type = 'Attendance'`,
        [studentId, activityId]
    );
    if (points > 0) {
        await pool.query(
            `INSERT INTO sports_achievements (student_id, activity_id, title, description, date, merit_points, type)
             VALUES (?, ?, 'Attendance Points', ?, CURDATE(), ?, 'Attendance')`,
            [studentId, activityId, `${attPct.toFixed(1)}% attendance (${present}/${total} sessions)`, points]
        );
    }
    return points;
};

// ── Achievement CRUD ──────────────────────────────────────────────────────────

export const addAchievement = async (achievement: Achievement): Promise<number> => {
    const { student_id, activity_id, match_id, title, description, date, merit_points, type } = achievement;
    const [res] = await pool.query<OkPacket>(
        'INSERT INTO sports_achievements (student_id, activity_id, match_id, title, description, date, merit_points, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [student_id, activity_id ?? null, match_id ?? null, title, description ?? null, date, merit_points, type]
    );
    return res.insertId;
};

export const getStudentAchievements = async (studentId: number): Promise<Achievement[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_achievements WHERE student_id = ? ORDER BY date DESC', [studentId]
    );
    return rows as Achievement[];
};

// ── Sports CV ─────────────────────────────────────────────────────────────────

export const getStudentSportsCV = async (studentId: number, activityId?: number) => {
    let achievFilter = 'WHERE sa.student_id = ?';
    const achievParams: any[] = [studentId];
    if (activityId) { achievFilter += ' AND sa.activity_id = ?'; achievParams.push(activityId); }

    const [achievements] = await pool.query<RowDataPacket[]>(
        `SELECT sa.*, a.name as activity_name FROM sports_achievements sa
         LEFT JOIN sports_activities a ON sa.activity_id = a.id
         ${achievFilter} ORDER BY sa.date DESC`,
        achievParams
    );

    const [memberships] = await pool.query<RowDataPacket[]>(
        `SELECT m.*, a.name as activity_name FROM sports_memberships m
         JOIN sports_activities a ON m.activity_id = a.id
         WHERE m.student_id = ? AND m.quit_at IS NULL`,
        [studentId]
    );

    const totals = { attendance: 0, match: 0, role: 0, total: 0 };
    (achievements as any[]).forEach((a: any) => {
        const pts = parseFloat(a.merit_points) || 0;
        if (a.type === 'Attendance') totals.attendance += pts;
        else if (a.type === 'Match_Award' || a.type === 'Participation') totals.match += pts;
        else if (a.type === 'Special_Recognition') totals.role += pts;
        totals.total += pts;
    });

    return { achievements, current_activities: memberships, totals };
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const getLeaderboard = async (activityId?: number, limit: number = 20) => {
    let query = `
        SELECT sa.student_id, sa.activity_id,
               ANY_VALUE(m.student_name) as student_name,
               ANY_VALUE(a.name) as activity_name,
               SUM(sa.merit_points) as total_points,
               ANY_VALUE(mem.role) as member_role
        FROM sports_achievements sa
        LEFT JOIN sports_memberships m ON sa.student_id = m.student_id AND sa.activity_id = m.activity_id
        LEFT JOIN sports_activities a ON sa.activity_id = a.id
        LEFT JOIN sports_memberships mem ON sa.student_id = mem.student_id AND sa.activity_id = mem.activity_id
        WHERE 1=1`;
    const params: any[] = [];
    if (activityId) { query += ' AND sa.activity_id = ?'; params.push(activityId); }
    query += ' GROUP BY sa.student_id, sa.activity_id ORDER BY total_points DESC LIMIT ?';
    params.push(limit);
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
};


// ── Time-Series Analytics ─────────────────────────────────────────────────────

export const getPointsTimeSeries = async (activityId?: number, period: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const groupFmt = period === 'weekly' ? '%Y-%u' : period === 'monthly' ? '%Y-%m' : '%Y';
    let query = `
        SELECT DATE_FORMAT(sa.date, ?) as period_label,
               SUM(sa.merit_points) as total_points,
               COUNT(DISTINCT sa.student_id) as student_count
        FROM sports_achievements sa WHERE 1=1`;
    const params: any[] = [groupFmt];
    if (activityId) { query += ' AND sa.activity_id = ?'; params.push(activityId); }
    query += ' GROUP BY period_label ORDER BY period_label ASC';
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
};
