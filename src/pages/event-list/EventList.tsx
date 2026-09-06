import styles from './EventList.module.scss';
// import { useState, useEffect } from 'react';
// import { useClientDashboard } from './model/useClientDashboard';
// import { useCalloutMessage } from '@/shared/components/callout/CalloutMessage';

export function Component() {
  // const { data, isError } = useClientDashboard();
  // const showMessage = useCalloutMessage();

  // const [profile, setProfile] = useState(null);

  // useEffect(() => {
  //   if (data) {
  //     setProfile(data.account);
  //   }
  // }, [data]);

  // useEffect(() => {
  //   if (isError) {
  //     showMessage('Something wrong', 'error');
  //   }
  // }, [isError, showMessage]);

  return <div className={styles.eventList}>EVENTS</div>;
}
