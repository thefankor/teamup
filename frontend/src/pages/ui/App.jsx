import { Hero } from "../../../components/hero/Hero";
import { OpenProjects } from "../../../components/openProjects/OpenProjects";
import style from './style.module.scss';

function App() {
  return (
    <div className={style.app}>
      <Hero />
      <OpenProjects />
    </div>
  );
}

export default App;
