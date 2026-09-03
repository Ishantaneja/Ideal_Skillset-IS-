import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Ideal Skillset`;
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
