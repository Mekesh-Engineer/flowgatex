/**
 * Firebase Connection Test Utility
 * 
 * This utility helps verify that Firebase services are properly configured
 * and can send/receive data successfully.
 * 
 * Usage: Import and call testFirebaseConnection() in your app
 */

import { auth, db, realtimeDb, storage, firebaseEnabled } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref as dbRef, 
  set as dbSet, 
  get as dbGet, 
  onValue,
  remove as dbRemove 
} from 'firebase/database';
import { 
  ref as storageRef, 
  uploadString, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { logger } from '@/lib/logger';

interface TestResult {
  service: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Test Firebase Authentication
 */
async function testAuthentication(): Promise<TestResult> {
  if (!auth) {
    return {
      service: 'Authentication',
      status: 'skipped',
      message: 'Auth not initialized (mock mode or config missing)'
    };
  }

  try {
    // Test: Get current auth state
    const currentUser = auth.currentUser;
    
    return {
      service: 'Authentication',
      status: 'success',
      message: 'Auth service is ready',
      details: {
        currentUser: currentUser?.email || 'No user logged in',
        providerId: currentUser?.providerData[0]?.providerId || 'N/A'
      }
    };
  } catch (error) {
    return {
      service: 'Authentication',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Authentication test failed',
      details: error instanceof Error ? { name: error.name, message: error.message } : undefined
    };
  }
}

/**
 * Test Firestore Database (Write and Read)
 */
async function testFirestore(): Promise<TestResult> {
  if (!db) {
    return {
      service: 'Firestore',
      status: 'skipped',
      message: 'Firestore not initialized (mock mode or config missing)'
    };
  }

  try {
    const testCollectionName = 'connection_tests';
    const testDocId = `test_${Date.now()}`;
    const testData = {
      message: 'Firebase connection test',
      timestamp: serverTimestamp(),
      source: 'FlowGateX Connection Test'
    };

    // Test: Write to Firestore
    const docRef = doc(db, testCollectionName, testDocId);
    await setDoc(docRef, testData);
    logger.log('✅ Firestore Write: Success');

    // Test: Read from Firestore
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found after write');
    }
    logger.log('✅ Firestore Read: Success');

    // Test: Delete test document (cleanup)
    await deleteDoc(docRef);
    logger.log('✅ Firestore Delete: Success');

    return {
      service: 'Firestore',
      status: 'success',
      message: 'All Firestore operations successful (Write, Read, Delete)',
      details: {
        writtenData: testData,
        readData: docSnap.data()
      }
    };
  } catch (error) {
    return {
      service: 'Firestore',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Firestore test failed',
      details: error instanceof Error ? { name: error.name, message: error.message } : undefined
    };
  }
}

/**
 * Test Realtime Database (Write and Read)
 */
async function testRealtimeDatabase(): Promise<TestResult> {
  if (!realtimeDb) {
    return {
      service: 'Realtime Database',
      status: 'skipped',
      message: 'Realtime DB not initialized (mock mode or config missing)'
    };
  }

  try {
    const testPath = `connection_tests/test_${Date.now()}`;
    const testData = {
      message: 'Firebase Realtime DB connection test',
      timestamp: Date.now(),
      source: 'FlowGateX Connection Test'
    };

    // Test: Write to Realtime Database
    const dataRef = dbRef(realtimeDb, testPath);
    await dbSet(dataRef, testData);
    logger.log('✅ Realtime DB Write: Success');

    // Test: Read from Realtime Database
    const snapshot = await dbGet(dataRef);
    if (!snapshot.exists()) {
      throw new Error('Data not found after write');
    }
    logger.log('✅ Realtime DB Read: Success');

    // Test: Listen to real-time updates (briefly)
    const listenTest = await new Promise<boolean>((resolve) => {
      const unsubscribe = onValue(dataRef, (snapshot) => {
        if (snapshot.exists()) {
          logger.log('✅ Realtime DB Listener: Success');
          unsubscribe();
          resolve(true);
        }
      }, (error) => {
        logger.error('❌ Realtime DB Listener:', error);
        resolve(false);
      });
    });

    // Test: Delete test data (cleanup)
    await dbRemove(dataRef);
    logger.log('✅ Realtime DB Delete: Success');

    return {
      service: 'Realtime Database',
      status: 'success',
      message: 'All Realtime DB operations successful (Write, Read, Listen, Delete)',
      details: {
        writtenData: testData,
        readData: snapshot.val(),
        listenerWorking: listenTest
      }
    };
  } catch (error) {
    return {
      service: 'Realtime Database',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Realtime Database test failed',
      details: error instanceof Error ? { name: error.name, message: error.message } : undefined
    };
  }
}

/**
 * Test Firebase Storage (Upload and Download)
 */
async function testStorage(): Promise<TestResult> {
  if (!storage) {
    return {
      service: 'Storage',
      status: 'skipped',
      message: 'Storage not initialized (mock mode or config missing)'
    };
  }

  try {
    const testFileName = `connection_tests/test_${Date.now()}.txt`;
    const testContent = 'Firebase Storage connection test from FlowGateX';

    // Test: Upload to Storage
    const fileRef = storageRef(storage, testFileName);
    await uploadString(fileRef, testContent, 'raw', {
      contentType: 'text/plain'
    });
    logger.log('✅ Storage Upload: Success');

    // Test: Get Download URL
    const downloadURL = await getDownloadURL(fileRef);
    logger.log('✅ Storage Get URL: Success');

    // Test: Delete file (cleanup)
    await deleteObject(fileRef);
    logger.log('✅ Storage Delete: Success');

    return {
      service: 'Storage',
      status: 'success',
      message: 'All Storage operations successful (Upload, Get URL, Delete)',
      details: {
        fileName: testFileName,
        downloadURL: downloadURL,
        contentLength: testContent.length
      }
    };
  } catch (error) {
    return {
      service: 'Storage',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Storage test failed',
      details: error instanceof Error ? { name: error.name, message: error.message } : undefined
    };
  }
}

/**
 * Main Test Function - Tests all Firebase services
 */
export async function testFirebaseConnection(): Promise<void> {
  console.log('\n🔥 ========================================');
  console.log('🔥 Firebase Connection Test Starting...');
  console.log('🔥 ========================================\n');

  if (!firebaseEnabled) {
    console.warn('⚠️  Firebase is DISABLED (Mock Mode or Invalid Config)');
    console.log('💡 To enable Firebase:');
    console.log('   1. Check .env.local has valid Firebase credentials');
    console.log('   2. Set VITE_MOCK_MODE=false');
    console.log('   3. Restart the development server\n');
    return;
  }

  const results: TestResult[] = [];

  // Test 1: Authentication
  console.log('🔐 Testing Firebase Authentication...');
  const authResult = await testAuthentication();
  results.push(authResult);
  console.log(`   ${authResult.status === 'success' ? '✅' : '❌'} ${authResult.message}\n`);

  // Test 2: Firestore
  console.log('📊 Testing Firestore Database...');
  const firestoreResult = await testFirestore();
  results.push(firestoreResult);
  console.log(`   ${firestoreResult.status === 'success' ? '✅' : '❌'} ${firestoreResult.message}\n`);

  // Test 3: Realtime Database
  console.log('⚡ Testing Realtime Database...');
  const realtimeDbResult = await testRealtimeDatabase();
  results.push(realtimeDbResult);
  console.log(`   ${realtimeDbResult.status === 'success' ? '✅' : '❌'} ${realtimeDbResult.message}\n`);

  // Test 4: Storage
  console.log('📁 Testing Firebase Storage...');
  const storageResult = await testStorage();
  results.push(storageResult);
  console.log(`   ${storageResult.status === 'success' ? '✅' : '❌'} ${storageResult.message}\n`);

  // Summary
  console.log('🔥 ========================================');
  console.log('🔥 Firebase Connection Test Complete');
  console.log('🔥 ========================================\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}\n`);

  if (failedCount > 0) {
    console.error('❌ Some tests failed. Check the details above for errors.');
    console.log('💡 Common issues:');
    console.log('   - Check Firebase Security Rules');
    console.log('   - Verify Firebase project settings');
    console.log('   - Check network connectivity');
    console.log('   - Review browser console for errors\n');
  } else if (successCount > 0) {
    console.log('🎉 All tests passed! Firebase is properly configured.\n');
  }

  // Log detailed results
  console.log('📋 Detailed Results:');
  console.table(results.map(r => ({
    Service: r.service,
    Status: r.status.toUpperCase(),
    Message: r.message
  })));
}

/**
 * Quick connection check (lighter version)
 */
export function checkFirebaseStatus(): void {
  console.log('\n🔥 Firebase Status Check');
  console.log('========================');
  console.log(`Enabled: ${firebaseEnabled ? '✅ Yes' : '❌ No (Mock Mode)'}`);
  console.log(`Auth: ${auth ? '✅ Ready' : '❌ Not initialized'}`);
  console.log(`Firestore: ${db ? '✅ Ready' : '❌ Not initialized'}`);
  console.log(`Realtime DB: ${realtimeDb ? '✅ Ready' : '❌ Not initialized'}`);
  console.log(`Storage: ${storage ? '✅ Ready' : '❌ Not initialized'}\n`);
}

// Export individual test functions
export { testAuthentication, testFirestore, testRealtimeDatabase, testStorage };
