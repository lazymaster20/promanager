// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar         from './components/Sidebar';
import Dashboard       from './pages/Dashboard';
import ProjectsList    from './pages/ProjectsList';
import ProjectDetail   from './pages/ProjectDetail';
import InvoicedProjects from './pages/InvoicedProjects';
import OverallPlan     from './pages/OverallPlan';
import Reports         from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar/>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"             element={<Dashboard/>}/>
            <Route path="/projects"     element={<ProjectsList/>}/>
            <Route path="/projects/:id" element={<ProjectDetail/>}/>
            <Route path="/invoiced"     element={<InvoicedProjects/>}/>
            <Route path="/overall-plan" element={<OverallPlan/>}/>
            <Route path="/reports"      element={<Reports/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
