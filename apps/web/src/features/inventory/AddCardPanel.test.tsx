import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddCardPanel } from "./AddCardPanel";

const fetchMock = vi.fn();

describe("AddCardPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("searches Scryfall names, selects an exact printing, and saves a PHP-priced lot", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith("/api/cards/search")) {
        return jsonResponse({ names: ["Lightning Bolt"] });
      }

      if (url.startsWith("/api/cards/prints")) {
        return jsonResponse({
          cards: [
            {
              id: "scryfall-lightning-bolt-m20-154",
              oracleId: "oracle-lightning-bolt",
              tcgplayerId: 12345,
              name: "Lightning Bolt",
              setCode: "m20",
              setName: "Core Set 2020",
              collectorNumber: "154",
              rarity: "common",
              colorIdentity: ["R"],
              imageUris: { small: "small.jpg", normal: "normal.jpg" },
              prices: { usd: "6.25", usd_foil: null, usd_etched: null },
              finishes: ["nonfoil"],
              releasedAt: "2019-07-12",
            },
          ],
        });
      }

      if (url === "/api/inventory" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        expect(body).toMatchObject({
          scryfallId: "scryfall-lightning-bolt-m20-154",
          cardName: "Lightning Bolt",
          setCode: "m20",
          collectorNumber: "154",
          condition: "NM",
          foilType: "nonfoil",
          language: "en",
          qty: 2,
          buyPricePhpPerCopy: 120,
          multiplier: 50,
        });
        return jsonResponse({ lot: { id: 1, ...body } }, 201);
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    render(
      <AddCardPanel
        defaultMultiplier="50"
        onClose={() => undefined}
        onSaved={onSaved}
      />,
    );

    await user.type(screen.getByLabelText("Card name"), "Lightning Bolt");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.click(await screen.findByRole("button", { name: /Core Set 2020/ }));
    await user.clear(screen.getByLabelText("Qty"));
    await user.type(screen.getByLabelText("Qty"), "2");
    await user.type(screen.getByLabelText("Buy price PHP per copy"), "120");
    await user.click(screen.getByRole("button", { name: "Save Lot" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });
});

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}
