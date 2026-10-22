import type { DirectoryScreenProps } from '../../../app/navigation/types';
import { EmployeeDetailView } from '../components/EmployeeDetailView';

export function EmployeeDetailScreen({ route, navigation }: DirectoryScreenProps<'EmployeeDetail'>) {
  return (
    <EmployeeDetailView
      userId={route.params.userId}
      onOpenEmployee={(userId) => navigation.push('EmployeeDetail', { userId })}
    />
  );
}
