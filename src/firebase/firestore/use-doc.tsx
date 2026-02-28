
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      console.log("--- [useDoc] Waiting for reference... ---");
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log(`--- [useDoc] ATTEMPTING FETCH: ${memoizedDocRef.path} ---`);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        console.log(`--- [useDoc] RESPONSE RECEIVED for: ${memoizedDocRef.path} ---`);
        console.log(`Exists: ${snapshot.exists()}`);
        
        if (snapshot.exists()) {
          console.log(`Data found:`, snapshot.data());
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          console.log(`Document does NOT exist at this path.`);
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        console.error(`--- [useDoc] FIRESTORE ERROR for: ${memoizedDocRef.path} ---`, error);
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
