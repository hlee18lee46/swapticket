// utils/tickets.ts
import { sui } from "@/lib/sui";

type TicketRow = {
  objectId: string;
  artist_code: number;
  seat: number;
  artist_name: string;
  venue: string;
  event_date: string; // ISO string
};

export async function fetchOwnedTickets(owner: string, packageId: string): Promise<TicketRow[]> {
  const type = `${packageId}::ticket::Ticket`;

  const resp = await sui.getOwnedObjects({
    owner,
    filter: { StructType: type },
    options: { showContent: true },
  });

  return (resp.data ?? [])
    .map((item) => {
      const obj = item.data;
      if (!obj || obj.content?.dataType !== "moveObject") return null;

      const fields: any = obj.content.fields;
      return {
        objectId: obj.objectId,
        artist_code: Number(fields.artist_code ?? fields.artist ?? 0),
        seat: Number(fields.seat ?? 0),
        artist_name: String(fields.artist_name ?? ""),
        venue: String(fields.venue ?? ""),
        event_date: fields.event_date
          ? new Date(Number(fields.event_date) * 1000).toISOString()
          : "",
      } as TicketRow;
    })
    ;
}