interface Props {
  title: string;
  count: number;
}

export function BoardHeader({ title, count }: Props) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-lg font-semibold text-brand-black">
        {title} <span className="text-text-light font-normal">({count})</span>
      </h2>
    </div>
  );
}
