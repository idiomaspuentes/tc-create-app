import { useEffect, useState } from 'react';

const usePermalink = () => {
  const [pathArray, setPathArray] = useState([]);
  const [queryParams, setQueryParams] = useState();

  useEffect(() => {
    const location = window.location;
    setPathArray(location.pathname.split('/'));
    setQueryParams(new URLSearchParams(location.search));
  }, []);

  return { pathArray, queryParams };
};

export default usePermalink;