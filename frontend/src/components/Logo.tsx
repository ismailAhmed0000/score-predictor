type LogoProps = {
  className?: string;
};

export function Logo({ className = 'h-9 w-9' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Score Predictor"
      className={`${className} object-contain`}
    />
  );
}
