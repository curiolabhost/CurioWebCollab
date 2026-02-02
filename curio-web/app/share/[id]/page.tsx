import ShareClient from "./share-client";

export default function SharePage({ params }: { params: { id: string } }) {
  return <ShareClient id={params.id} />;
}
