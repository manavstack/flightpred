import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FlightSearchPage from './pages/FlightSearchPage'
import PriceAlertPage from './pages/PriceAlertPage'
import PriceTrendPage from './pages/PriceTrendPage'
import FareCalendarPage from './pages/FareCalendarPage'
import BudgetFinderPage from './pages/BudgetFinderPage'
import AdvisorPage from './pages/AdvisorPage'
import ModelLogsPage from './pages/ModelLogsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<FlightSearchPage />} />
          <Route path="/alerts" element={<PriceAlertPage />} />
          <Route path="/trends" element={<PriceTrendPage />} />
          <Route path="/fare-calendar" element={<FareCalendarPage />} />
          <Route path="/budget" element={<BudgetFinderPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/model-logs" element={<ModelLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
