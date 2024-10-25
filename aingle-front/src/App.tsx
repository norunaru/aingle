import { Route, Routes, useLocation } from "react-router-dom";
import OnboardingPages from "./routes/OnboardingPages";
import HomePages from "./routes/HomePages";
import Footer from "./components/footer/Footer";
import VotePages from "./routes/VotePages";
import MyPages from "./routes/MyPages";
import Write from "./pages/write/Write";

const App = () => {
  const location = useLocation();
  return (
    <div className="h-[780px] w-[375px] relative">
      <Routes>
        <Route path="/home/*" element={<HomePages />} />
        <Route path="/vote/*" element={<VotePages />} />
        <Route path="/mypage/*" element={<MyPages />} />
        <Route path="/write" element={<Write />} />
        <Route path="/*" element={<OnboardingPages />} />
      </Routes>
      {location.pathname !== "/write" && location.pathname !== "/" && (
        <Footer />
      )}
    </div>
  );
};

export default App;
