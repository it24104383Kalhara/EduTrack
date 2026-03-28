import dotenv from 'dotenv';
dotenv.config();
import pool from './src/config/database';
import GradeModel from './src/models/Grade';

async function runGlobalSync() {
    console.log('🔄 [GLOBAL_SYNC_START]: Reconciling student academic records with current assignments...');
    
    try {
        // 1. Get all current assignments
        const [assignments] = await pool.execute(
            'SELECT student_id, grade_id, student_name, grade, section FROM student_assignment'
        );
        
        console.log(`📋 [GLOBAL_SYNC]: Found ${(assignments as any[]).length} current assignments.`);

        let totalTransfers = 0;

        for (const assignment of assignments as any[]) {
            const { student_id, grade_id: currentGradeId, student_name } = assignment;
            
            // 2. Find any marks for this student in OTHER grades
            const [orphanedGrades] = await pool.execute(
                'SELECT DISTINCT grade_id FROM marks WHERE student_id = ? AND grade_id != ?',
                [student_id, currentGradeId]
            );

            if ((orphanedGrades as any[]).length > 0) {
                console.log(`🔎 [GLOBAL_SYNC]: Student ${student_name} (ID: ${student_id}) has records in other grades.`);
                
                for (const row of orphanedGrades as any[]) {
                    const oldGradeId = row.grade_id;
                    try {
                        console.log(`🚀 [GLOBAL_SYNC]: Transferring records for ${student_name} from Grade ${oldGradeId} to ${currentGradeId}...`);
                        await GradeModel.transferRecords(student_id, oldGradeId, currentGradeId);
                        totalTransfers++;
                    } catch (e) {
                        console.error(`❌ [GLOBAL_SYNC_ERROR]: Failed to transfer for student ${student_id}`, e);
                    }
                }
            }
        }

        console.log(`🏁 [GLOBAL_SYNC_COMPLETE]: Finished. total transfers executed: ${totalTransfers}`);
        process.exit(0);
    } catch (error) {
        console.error('🔴 [GLOBAL_SYNC_CRITICAL_ERROR]:', error);
        process.exit(1);
    }
}

runGlobalSync();
