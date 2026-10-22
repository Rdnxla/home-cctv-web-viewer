import {Flex, Grid} from '@radix-ui/themes';
import type {ReactNode} from 'react';
import {useEffect, useState} from 'react';
import styles from './MediaWithAside.module.scss';

const REST_HEIGHT_VAR = '--rest-height';

function useRestHeight() {
  const [main, setMain] = useState<HTMLDivElement | null>(null);
  const [media, setMedia] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!(main && media)) return;
    const observer = new ResizeObserver(() => {
      const rest = main.getBoundingClientRect().height - media.getBoundingClientRect().height;
      main.style.setProperty(REST_HEIGHT_VAR, `${Math.max(0, rest)}px`);
    });
    observer.observe(main);
    observer.observe(media);
    return () => {
      observer.disconnect();
      main.style.removeProperty(REST_HEIGHT_VAR);
    };
  }, [main, media]);

  return {setMain, setMedia};
}

interface MediaWithAsideProps {
  aside: ReactNode;
  children?: ReactNode;
  mainGap?: '3' | '4';
  media?: ReactNode;
}

export function MediaWithAside(props: MediaWithAsideProps) {
  const {aside, children, mainGap = '3', media} = props;
  const {setMain, setMedia} = useRestHeight();

  return (
    <Grid
      className={styles.mediaWithAside}
      flexGrow='1'
      gap='4'
    >
      <Flex
        className={styles.mediaWithAside__main}
        direction='column'
        gap={mainGap}
        minWidth='0'
        ref={setMain}
      >
        {media ? <div ref={setMedia}>{media}</div> : null}
        {children}
      </Flex>
      <div className={styles.mediaWithAside__aside}>{aside}</div>
    </Grid>
  );
}
