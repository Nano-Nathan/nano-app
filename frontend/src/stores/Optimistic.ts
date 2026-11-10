import type { InfiniteData } from '@tanstack/query-core';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/** What a read shows before a write on its path or its parent is answered */
export default abstract class Optimistic {
  /** A read with the item of an id replaced by a new one, or left out without it */
  public static apply(
    oData: ApiResponse | InfiniteData<ApiResponse>,
    sId: string,
    oItem?: unknown,
  ): ApiResponse | InfiniteData<ApiResponse> {
    // Applies it to each page of the pages of a path
    if ('pages' in oData) {
      return { ...oData, pages: oData.pages.map(oPage => Optimistic.page(oPage, sId, oItem)) };
    }

    // Applies it to one read
    return Optimistic.page(oData, sId, oItem);
  }

  /** One read: its own item, or the item of the id in its list */
  private static page(oPage: ApiResponse, sId: string, oItem?: unknown): ApiResponse {
    // A read of the item itself shows the new one
    if (!Array.isArray(oPage.result)) return oItem ? { ...oPage, result: oItem } : oPage;

    // A list shows the new item in place of the one of its id, or leaves it out without it
    const aItems: NanoObject[] = oPage.result;
    const fnIsOther = (oEntry: NanoObject): boolean => String(oEntry.id) !== sId;
    const aResult = oItem
      ? aItems.map(oEntry => (fnIsOther(oEntry) ? oEntry : oItem))
      : aItems.filter(fnIsOther);
    return { ...oPage, result: aResult };
  }
}
