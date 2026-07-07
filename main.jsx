import React from 'react';
import { createRoot } from 'react-dom/client';
import DepartmentGrid from './components/DepartmentGrid';
import InformationDepartment from './components/InformationDepartment';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Root element with id 'root' not found.");
}

createRoot(rootElement).render(
    <React.StrictMode>
      <DepartmentGrid />
      <InformationDepartment />
    </React.StrictMode>
  );
