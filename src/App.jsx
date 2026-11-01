// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PWABadge from './components/PWABadge';

// Lazy load untuk setiap halaman
const Catalog = lazy(() => import('./pages/Catalog'));
const GunDetail = lazy(() => import('./components/gun/GunDetail'));
const CreateGunPage = lazy(() => import('./pages/CreateGunPage'));
const EditGunPage = lazy(() => import('./pages/EditGunPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Fallback UI saat halaman sedang di-load
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-900 text-white">
        <Header />
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/gun/:id" element={<GunDetail />} />
              <Route path="/create" element={<CreateGunPage />} />
              <Route path="/edit/:id" element={<EditGunPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <PWABadge />
      </div>
    </Router>
  );
}

export default App;
