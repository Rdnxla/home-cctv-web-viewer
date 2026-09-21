import './ClientDashboard.scss';
import { useState, useEffect } from 'react';
import { Flex } from '@radix-ui/themes';
import { ClientSidebar } from '@/widgets/client-sidebar/ClientSidebar';
// import { BookingsPanel } from '@/widgets/bookings-panel/ui/BookingsPanel';
// import { RecommendedPanel } from '@/widgets/recommended-panel/ui/RecommendedPanel';
import { useClientDashboard } from './model/useClientDashboard';
import { useCalloutMessage } from '@/shared/components/callout/CalloutMessage';

export function Component() {
  const { data, isError } = useClientDashboard();
  const showMessage = useCalloutMessage();

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [instructors, setInstructors] = useState(null);

  useEffect(() => {
    if (data) {
      setProfile(data.account);
      setSummary(data.stats);
    }
  }, [data]);

  useEffect(() => {
    if (isError) {
      showMessage('Something wrong', 'error');
    }
  }, [isError, showMessage]);

  return (
    <Flex className="client-dashboard"> 
      <ClientSidebar
        profile={profile} 
        summary={summary} 
      />
      {/* <BookingsPanel />
      <RecommendedPanel /> */}
    </Flex>
  );
}
