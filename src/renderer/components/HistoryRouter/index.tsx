import type { History } from 'history';
import { useEffect, useState } from 'react';
import { Router, RouterProps } from 'react-router';
import type { NavigationType } from 'react-router-dom';

type HistoryRouterProps = Omit<RouterProps, 'navigationType' | 'location' | 'navigator'> & {
  history: History;
};

export default function HistoryRouter({ history, children }: HistoryRouterProps) {
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useEffect(() => {
    return history.listen(setState);
  }, [history]);

  return (
    <Router location={state.location} navigationType={state.action as NavigationType} navigator={history}>
      {children}
    </Router>
  );
}