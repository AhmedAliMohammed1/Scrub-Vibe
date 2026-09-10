import { Star } from "lucide-react";

export function ReviewStars({
  rating,
  label,
  size = 16,
  className = "",
}: {
  rating: number;
  label: string;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[#bd6b2c] ${className}`}
      role="img"
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={1.8}
          fill={star <= rounded ? "currentColor" : "transparent"}
          className={star <= rounded ? "" : "text-[#c9cfca]"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
