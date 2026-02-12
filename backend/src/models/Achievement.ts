import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Match {
    id?: number;
    activity_id: number;
    date: string; // YYYY-MM-DD
    opponent: string;
    result: 'Win' | 'Loss' | 'Draw' | 'Upcoming';
    score_team?: number;
    score_opponent?: number;
    location?: string;
    notes?: string;
}

export interface Achievement {
    id?: number;
    student_id: number;
    activity_id?: number | null; // Optional: linked to a specific sport
    match_id?: number | null; // Optional: linked to a specific match
    title: string; // e.g., "Man of the Match", "School Colors", "District Champion"
    description?: string;
    date: string;
    merit_points: number;
    type: 'Match_Award' | 'Season_Award' | 'Special_Recognition' | 'Participation';
}

// Match Management
export const createMatch = async (match: Match): Promise<number> => {
    const { activity_id, date, opponent, result, score_team, score_opponent, location, notes } = match;
    const [res] = await pool.query<OkPacket>(
        'INSERT INTO sports_matches (activity_id, date, opponent, result, score_team, score_opponent, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [activity_id, date, opponent, result, score_team, score_opponent, location, notes]
    );
    return res.insertId;
};

export const getMatches = async (activityId?: number): Promise<Match[]> => {
    let query = 'SELECT * FROM sports_matches WHERE 1=1';
    const params: any[] = [];

    if (activityId) {
        query += ' AND activity_id = ?';
        params.push(activityId);
    }

    query += ' ORDER BY date DESC';
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Match[];
};

export const updateMatchResult = async (id: number, updates: Partial<Match>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.result) { fields.push('result = ?'); values.push(updates.result); }
    if (updates.score_team !== undefined) { fields.push('score_team = ?'); values.push(updates.score_team); }
    if (updates.score_opponent !== undefined) { fields.push('score_opponent = ?'); values.push(updates.score_opponent); }
    if (updates.notes) { fields.push('notes = ?'); values.push(updates.notes); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(`UPDATE sports_matches SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteMatch = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_matches WHERE id = ?', [id]);
};

// Achievement & Merit Points
export const addAchievement = async (achievement: Achievement): Promise<number> => {
    const { student_id, activity_id, match_id, title, description, date, merit_points, type } = achievement;
    const [res] = await pool.query<OkPacket>(
        'INSERT INTO sports_achievements (student_id, activity_id, match_id, title, description, date, merit_points, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [student_id, activity_id, match_id, title, description, date, merit_points, type]
    );
    return res.insertId;
};

export const getStudentAchievements = async (studentId: number): Promise<Achievement[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_achievements WHERE student_id = ? ORDER BY date DESC',
        [studentId]
    );
    return rows as Achievement[];
};

export const getStudentSportsCV = async (studentId: number) => {
    // Get total points
    const [pointsRow] = await pool.query<RowDataPacket[]>(
        'SELECT SUM(merit_points) as total_points FROM sports_achievements WHERE student_id = ?',
        [studentId]
    );

    // Get achievements
    const achievements = await getStudentAchievements(studentId);

    // Get memberships (current sports)
    const [memberships] = await pool.query<RowDataPacket[]>(
        `SELECT m.*, a.name as activity_name 
         FROM sports_memberships m 
         JOIN sports_activities a ON m.activity_id = a.id 
         WHERE m.student_id = ? AND m.quit_at IS NULL`,
        [studentId]
    );

    return {
        total_merit_points: pointsRow[0].total_points || 0,
        achievements,
        current_activities: memberships
    };
};

export const getLeaderboard = async (limit: number = 10) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT student_id, SUM(merit_points) as total_points 
         FROM sports_achievements 
         GROUP BY student_id 
         ORDER BY total_points DESC 
         LIMIT ?`,
        [limit]
    );
    return rows;
};
