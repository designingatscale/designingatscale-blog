import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostView from './pages/PostView';
import SeriesList from './pages/SeriesList';
import Topics from './pages/Topics';
import AllPosts from './pages/AllPosts';
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostView />} />
          <Route path="/posts" element={<AllPosts />} />
          <Route path="/series" element={<SeriesList />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
