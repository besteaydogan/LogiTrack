import { EmptyState } from './EmptyState';

type StateMessageProps = {
  title: string;
  description: string;
};

export function StateMessage({ title, description }: StateMessageProps) {
  return <EmptyState title={title} description={description} />;
}
