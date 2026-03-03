import { Hero } from "../../../components/hero/Hero";
import { OpenProjects } from "../../../components/openProjects/OpenProjects";
import { SeoMeta } from "../../components/seo/SeoMeta";
import style from './style.module.scss';

function App() {
  return (
    <>
      <SeoMeta
        title="Платформа проектов и команд"
        description="Ищите проекты, команду и специалистов для реализации идей на TeamUp."
        canonicalPath="/"
      />
      <div className={style.app}>
        <Hero />
        <OpenProjects />
      </div>
    </>
  );
}

export default App;
