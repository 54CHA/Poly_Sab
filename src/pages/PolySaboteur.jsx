import Main from "../components/Main";

const PolySaboteur = () => {
  return (
    <div className="relative bg-dot-pattern">
      <div className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-xl" />
      <main className="max-w-[1200px] mx-auto p-4 sm:p-6">
        <Main />
      </main>
    </div>
  );
};

export default PolySaboteur;
