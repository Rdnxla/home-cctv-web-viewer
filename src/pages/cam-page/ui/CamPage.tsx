import {ArrowLeftIcon, LinkBreak2Icon} from '@radix-ui/react-icons';
import {
  AspectRatio,
  Button,
  Code,
  Flex,
  Grid,
  Heading,
  Link,
  Skeleton,
  Text,
} from '@radix-ui/themes';
import {useCallback} from 'react';
import {
  Link as RouterLink,
  useParams,
} from 'react-router';
import {useCameraQuery} from '@/entities/camera';
import {isApiError} from '@/shared/api/http';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {ROUTES} from '@/shared/config/routes';
import {LoadError} from '@/shared/ui';
import {CameraView} from './CameraView';
import styles from './CamPage.module.scss';
import {OtherCameras} from './OtherCameras';

const HTTP_NOT_FOUND = 404;

interface CameraNotFoundProps {
  id: string;
}

interface CamPageContentProps {
  id: string;
}

function CameraViewSkeleton() {
  return (
    <>
      <Skeleton height='32px' width='280px' />
      <Grid align='start' columns={CONTENT_WITH_ASIDE_COLUMNS} gap='4'>
        <AspectRatio ratio={16 / 9}>
          <Skeleton height='100%' width='100%' />
        </AspectRatio>
        <Skeleton height='320px' width='100%' />
      </Grid>
    </>
  );
}

function CameraNotFound(props: CameraNotFoundProps) {
  const {id} = props;

  return (
    <>
      <title>Камера не найдена — Камеры</title>
      <Flex align='center' direction='column' gap='3' py='8'>
        <Text as='span' color='gray'>
          <LinkBreak2Icon aria-hidden='true' height={40} width={40} />
        </Text>
        <Heading as='h2' size='5'>
          Камера не найдена
        </Heading>
        <Text align='center' color='gray' size='2'>
          На устройстве нет камеры с идентификатором <Code>{id}</Code>
        </Text>
        <Button asChild>
          <RouterLink to={ROUTES.dashboard}>К списку камер</RouterLink>
        </Button>
      </Flex>
      <OtherCameras currentId={id} />
    </>
  );
}

function CamPageContent(props: CamPageContentProps) {
  const {id} = props;
  const {data: camera, error, isPending, refetch} = useCameraQuery(id);

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  if (camera) return <CameraView camera={camera} />;
  if (isPending) return <CameraViewSkeleton />;
  // Не опираться на error.code: nvr-моки отдают {code}, а apiFetch читает {error} (DATA-001)
  if (isApiError(error) && error.status === HTTP_NOT_FOUND) return <CameraNotFound id={id} />;
  return (
    <LoadError
      message={`Не удалось загрузить данные камеры: ${error?.message ?? 'неизвестная ошибка'}`}
      onRetry={retry}
    />
  );
}

export function Component() {
  const {id = ''} = useParams();

  return (
    <section className={styles.camPage}>
      <Flex direction='column' gap='4'>
        <Link asChild color='gray' size='2'>
          <RouterLink className={styles.camPage__back} to={ROUTES.dashboard}>
            <ArrowLeftIcon aria-hidden='true' />
            Все камеры
          </RouterLink>
        </Link>
        <CamPageContent id={id} />
      </Flex>
    </section>
  );
}
