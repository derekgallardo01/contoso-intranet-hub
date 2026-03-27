import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Avatar,
  Text,
  Badge,
  Link,
  Divider,
  PresenceBadgeStatus,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  MailRegular,
  PhoneRegular,
  BuildingRegular,
  PersonRegular,
  DismissRegular,
} from '@fluentui/react-icons';
import { Button } from '@fluentui/react-components';
import { IPerson, PresenceStatus } from '../../../models/IPerson';
import { GraphService } from '../../../services/GraphService';

const useStyles = makeStyles({
  profileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  detailIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '20px',
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: tokens.colorNeutralForeground3,
  },
});

const presenceMap: Record<PresenceStatus, PresenceBadgeStatus> = {
  Available: 'available',
  Busy: 'busy',
  Away: 'away',
  Offline: 'offline',
};

export interface IPersonDetailPanelProps {
  person: IPerson | null;
  isOpen: boolean;
  onClose: () => void;
  graphService: GraphService | null;
  showPresence: boolean;
}

export const PersonDetailPanel: React.FC<IPersonDetailPanelProps> = ({
  person,
  isOpen,
  onClose,
  graphService,
  showPresence,
}) => {
  const styles = useStyles();
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [presence, setPresence] = useState<PresenceStatus>('Offline');

  useEffect(() => {
    if (!person || !graphService || !isOpen) return;

    let cancelled = false;

    const fetchDetails = async (): Promise<void> => {
      try {
        const [photo, pres] = await Promise.all([
          graphService.getUserPhoto(person.id),
          showPresence ? graphService.getUserPresence(person.id) : Promise.resolve('Offline' as PresenceStatus),
        ]);
        if (!cancelled) {
          setPhotoUrl(photo);
          setPresence(pres);
        }
      } catch {
        // Silently fail for photos/presence
      }
    };

    fetchDetails();
    return () => { cancelled = true; };
  }, [person, graphService, isOpen, showPresence]);

  if (!person) return null;

  return (
    <OverlayDrawer
      open={isOpen}
      onOpenChange={(_ev, data) => { if (!data.open) onClose(); }}
      position="end"
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
              aria-label="Close"
            />
          }
        >
          Profile Details
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div className={styles.profileHeader}>
          <Avatar
            name={person.displayName}
            image={photoUrl ? { src: photoUrl } : undefined}
            size={96}
            badge={
              showPresence
                ? { status: presenceMap[presence] }
                : undefined
            }
          />
          <Text size={600} weight="bold">
            {person.displayName}
          </Text>
          <Text size={400}>{person.jobTitle || 'No title'}</Text>
          {person.department && (
            <Badge appearance="filled" color="brand" size="large">
              {person.department}
            </Badge>
          )}
        </div>

        <Divider />

        <div className={styles.detailSection}>
          {person.email && (
            <div className={styles.detailRow}>
              <MailRegular className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <Text size={200} className={styles.label}>
                  Email
                </Text>
                <Link href={`mailto:${person.email}`}>{person.email}</Link>
              </div>
            </div>
          )}

          {person.phone && (
            <div className={styles.detailRow}>
              <PhoneRegular className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <Text size={200} className={styles.label}>
                  Phone
                </Text>
                <Link href={`tel:${person.phone}`}>{person.phone}</Link>
              </div>
            </div>
          )}

          {person.officeLocation && (
            <div className={styles.detailRow}>
              <BuildingRegular className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <Text size={200} className={styles.label}>
                  Office
                </Text>
                <Text>{person.officeLocation}</Text>
              </div>
            </div>
          )}

          <div className={styles.detailRow}>
            <PersonRegular className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <Text size={200} className={styles.label}>
                Presence
              </Text>
              <Text>{presence}</Text>
            </div>
          </div>
        </div>
      </DrawerBody>
    </OverlayDrawer>
  );
};
