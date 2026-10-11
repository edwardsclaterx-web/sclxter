export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="widget-frame h-dvh overflow-hidden">{children}</div>;
}
