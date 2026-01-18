/**
 * AnimatedHeading - Animated color wave text effect
 * Creates a left-to-right color sweep animation on each letter
 */

interface AnimatedHeadingProps {
  text: string;
  className?: string;
}

const AnimatedHeading = ({ text, className = '' }: AnimatedHeadingProps) => {
  return (
    <div className={`font-mono text-xs tracking-widest ${className}`}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="animate-color-wave inline-block"
          style={{
            animationDelay: `${index * 0.08}s`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

export default AnimatedHeading;
