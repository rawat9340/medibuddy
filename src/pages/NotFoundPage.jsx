import { Link } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage';

export default function NotFoundPage() {
  return (
    <StatusMessage
      title="Page not found"
      action={
        <Link className="button" to="/">
          Search medicines
        </Link>
      }
    />
  );
}
