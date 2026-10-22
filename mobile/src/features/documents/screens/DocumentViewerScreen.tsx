import type { DocumentsScreenProps } from '../../../app/navigation/types';
import { DocumentDetailView } from '../components/DocumentDetailView';

export function DocumentViewerScreen({ route }: DocumentsScreenProps<'DocumentViewer'>) {
  return <DocumentDetailView documentId={route.params.documentId} />;
}
