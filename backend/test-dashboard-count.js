// Test script to verify dashboard data
console.log('🔍 Testing Dashboard Data Flow...\n');

// Test 1: Check if backend is running
async function testBackend() {
  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      console.log('✅ Backend is running');
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
    return false;
  }
}

// Test 2: Check student API
async function testStudentAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/students');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Student API working: ${data.data?.length || 0} students found`);
      return data.data?.length || 0;
    } else {
      console.log('❌ Student API failed');
      return 0;
    }
  } catch (error) {
    console.log('❌ Student API error:', error.message);
    return 0;
  }
}

// Test 3: Check grade API
async function testGradeAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/grades');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Grade API working: ${data.data?.length || 0} grades found`);
      return data.data?.length || 0;
    } else {
      console.log('❌ Grade API failed');
      return 0;
    }
  } catch (error) {
    console.log('❌ Grade API error:', error.message);
    return 0;
  }
}

// Test 4: Check assignments API
async function testAssignmentsAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/grades/assignments');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Assignments API working: ${data.data?.length || 0} assignments found`);
      return data.data?.length || 0;
    } else {
      console.log('❌ Assignments API failed');
      return 0;
    }
  } catch (error) {
    console.log('❌ Assignments API error:', error.message);
    return 0;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Dashboard Tests...\n');
  
  const backendOk = await testBackend();
  if (!backendOk) {
    console.log('\n❌ Backend is not running. Please start the backend server first.');
    return;
  }
  
  const studentCount = await testStudentAPI();
  const gradeCount = await testGradeAPI();
  const assignmentCount = await testAssignmentsAPI();
  
  console.log('\n📊 Summary:');
  console.log(`   Students: ${studentCount}`);
  console.log(`   Grades: ${gradeCount}`);
  console.log(`   Assignments: ${assignmentCount}`);
  
  console.log('\n💡 What you should see on dashboard:');
  console.log(`   Total Students in School: ${studentCount}`);
  console.log(`   Total Grades in School: ${gradeCount}`);
  
  if (assignmentCount > 0) {
    console.log('\n👥 To see student assignments:');
    console.log('   1. Click "Manage Grades" in sidebar');
    console.log('   2. Click "📋 View All Assignments" button');
    console.log('   3. Or click "👥 Assign" for any grade');
  }
}

runTests().catch(console.error);
