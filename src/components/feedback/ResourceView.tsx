import type { ReactNode } from 'react';
import type { Resource } from '../../hooks/useResource';
import { LoadingState } from './LoadingState';
import { Notice } from './Notice';

export function ResourceView<T>({ resource, label, placeholder, empty, children }: {
  resource: Resource<T>;
  label?: string;
  placeholder?: ReactNode;
  empty?: { when: (data: T) => boolean; title: string; message: string };
  children: (data: T) => ReactNode;
}) {
  if (!resource.value) return <LoadingState label={label}>{placeholder}</LoadingState>;
  if (resource.value.status === 'error') {
    return <Notice title="Couldn’t load this page" message={resource.value.message} retry={resource.reload} />;
  }
  const data = resource.value.data;
  if (empty?.when(data)) return <Notice title={empty.title} message={empty.message} />;
  return <>{children(data)}</>;
}
