const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1000px] mx-auto p-4">
        <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2024 Poly Saboteur. Права не защищены)
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
