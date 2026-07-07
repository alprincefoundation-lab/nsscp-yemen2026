"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

export function SkeletonTable() {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
}
