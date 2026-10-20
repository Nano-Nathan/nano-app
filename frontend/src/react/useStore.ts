'use client';

import { useSnapshot } from 'valtio/react';
import { useStoreManager } from './NanoAppProvider';
import type { StoreHandle } from '../types/hooks';

/** Reads and writes a store by path; the component re-renders only when what it read changes */
export default function useStore(sName: string): StoreHandle {
  // Subscribes the render to the state it reads
  const oManager = useStoreManager();
  const oSnapshot = useSnapshot(oManager.oRoot);
  const oStore = oManager.getStore(sName);

  return {
    get: sPath => oStore.get(sPath, oSnapshot),
    set: (sPath, oValue) => oStore.set(sPath, oValue),
  };
}
