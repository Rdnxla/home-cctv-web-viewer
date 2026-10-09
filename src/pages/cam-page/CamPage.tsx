import styles from './CamPage.module.scss'
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { CameraCard } from '@/entities/camera-card/CameraCard'
import { CameraControls } from '@/widgets/camera-control/CameraControls'

const otherCams = [
  {
    name: 'Ворота'
  },
  {
    name: 'Гараж'
  },
  {
    name: 'Входная дверь'
  },
]

export function Component() {
  return (
    <section className={styles.camPage}>
      <Flex gap="4" wrap="nowrap">
        <Box width='100%'>
          <Flex
            align='center'
            justify='between'
            mb='4'
            wrap="nowrap"
          >
            <Heading as="h2" mb="2" size="6">Двор</Heading>
            <Button type='button'>
              Назад к списку
            </Button>
          </Flex>
          <CameraCard>
            <p>Блок управления</p>
          </CameraCard>
          <Heading as="h2" my="4" size="6">Другие камеры</Heading>
          <Flex
            align='center'
            mb='4'
            overflow='scroll'
            wrap="nowrap"
          >
            {
              otherCams.map((item) => (
                <a className={styles.camPage__camLink} href='/' key={item.name}>
                  <Heading as="h4" size="4">{item.name}</Heading>
                  <Text my="4">{'Перейти ->'}</Text>
                </a>
              ))
            }
          </Flex>
        </Box>
        <CameraControls />
      </Flex>
    </section>
  );
}
