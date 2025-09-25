import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ProjectDetailClient } from './project-detail-client'

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <ProjectDetailClient user={user} projectId={params.id} />
}
