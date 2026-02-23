import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Directory } from './pages/Directory';
import { ResourceDetail } from './pages/ResourceDetail';
import { Map } from './pages/Map';
import { AIHelp } from './pages/AIHelp';
import { About } from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="directory" element={<Directory />} />
          <Route path="resource/:id" element={<ResourceDetail />} />
          <Route path="map" element={<Map />} />
          <Route path="ai" element={<AIHelp />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
