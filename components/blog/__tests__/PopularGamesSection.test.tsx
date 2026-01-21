import { render, screen } from "@testing-library/react";
import { PopularGamesSection } from "../PopularGamesSection";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock convex/react
const mockUseQuery = jest.fn();
jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// Mock the api
jest.mock("@/convex/_generated/api", () => ({
  api: {
    wordGames: {
      listGames: "wordGames:listGames",
    },
  },
}));

const mockGames = [
  {
    _id: "game1",
    title: "Vocabulary Match",
    description: "Match words with their translations",
    level: "A1",
    slug: "vocabulary-match",
    status: "published",
  },
  {
    _id: "game2",
    title: "Grammar Challenge",
    description: "Test your grammar knowledge",
    level: "B1",
    slug: "grammar-challenge",
    status: "published",
  },
  {
    _id: "game3",
    title: "Advanced Syntax",
    description: "Master complex sentence structures",
    level: "C1",
    slug: "advanced-syntax",
    status: "published",
  },
];

describe("PopularGamesSection", () => {
  beforeEach(() => {
    mockUseQuery.mockClear();
  });

  describe("loading state", () => {
    it("renders loading skeletons when data is loading", () => {
      mockUseQuery.mockReturnValue(undefined);
      const { container } = render(<PopularGamesSection />);

      // Should render 3 skeleton cards with animate-pulse class
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(3);
    });

    it("renders section header while loading", () => {
      mockUseQuery.mockReturnValue(undefined);
      render(<PopularGamesSection />);

      expect(
        screen.getByRole("heading", {
          name: /practice with interactive games/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe("with games", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue(mockGames);
    });

    it("renders the section headline", () => {
      render(<PopularGamesSection />);
      expect(
        screen.getByRole("heading", {
          name: /practice with interactive games/i,
        })
      ).toBeInTheDocument();
    });

    it("renders the subheadline about learning through play", () => {
      render(<PopularGamesSection />);
      expect(
        screen.getByText(/learning through play is the most effective way/i)
      ).toBeInTheDocument();
    });

    it("renders the Interactive Learning badge", () => {
      render(<PopularGamesSection />);
      expect(screen.getByText(/interactive learning/i)).toBeInTheDocument();
    });

    it("renders 3 game cards", () => {
      render(<PopularGamesSection />);

      expect(
        screen.getByRole("heading", { name: /vocabulary match/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /grammar challenge/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /advanced syntax/i })
      ).toBeInTheDocument();
    });

    it("renders game descriptions", () => {
      render(<PopularGamesSection />);

      expect(
        screen.getByText(/match words with their translations/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/test your grammar knowledge/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/master complex sentence structures/i)
      ).toBeInTheDocument();
    });

    it("renders difficulty badges for each game", () => {
      render(<PopularGamesSection />);

      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText("B1")).toBeInTheDocument();
      expect(screen.getByText("C1")).toBeInTheDocument();
    });

    it("renders View All Games link", () => {
      render(<PopularGamesSection />);
      const viewAllLink = screen.getByRole("link", { name: /view all games/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute("href", "/games");
    });

    it("renders correct game links", () => {
      render(<PopularGamesSection />);
      const playButtons = screen.getAllByRole("link", { name: /play now/i });

      expect(playButtons[0]).toHaveAttribute("href", "/games/vocabulary-match");
      expect(playButtons[1]).toHaveAttribute("href", "/games/grammar-challenge");
      expect(playButtons[2]).toHaveAttribute("href", "/games/advanced-syntax");
    });
  });

  describe("empty state", () => {
    it("renders empty state when no games are available", () => {
      mockUseQuery.mockReturnValue([]);
      render(<PopularGamesSection />);

      expect(
        screen.getByText(/no games available yet/i)
      ).toBeInTheDocument();
    });

    it("does not render View All Games link when empty", () => {
      mockUseQuery.mockReturnValue([]);
      render(<PopularGamesSection />);

      expect(
        screen.queryByRole("link", { name: /view all games/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("query parameters", () => {
    it("calls useQuery with correct parameters", () => {
      mockUseQuery.mockReturnValue(mockGames);
      render(<PopularGamesSection />);

      expect(mockUseQuery).toHaveBeenCalledWith("wordGames:listGames", {
        status: "published",
        limit: 3,
      });
    });
  });

  describe("styling", () => {
    it("applies custom className when provided", () => {
      mockUseQuery.mockReturnValue(mockGames);
      const { container } = render(
        <PopularGamesSection className="custom-class" />
      );
      const section = container.querySelector("section");
      expect(section).toHaveClass("custom-class");
    });

    it("has correct padding classes", () => {
      mockUseQuery.mockReturnValue(mockGames);
      const { container } = render(<PopularGamesSection />);
      const section = container.querySelector("section");
      expect(section).toHaveClass("py-16");
      expect(section).toHaveClass("lg:py-24");
    });

    it("renders responsive grid for game cards", () => {
      mockUseQuery.mockReturnValue(mockGames);
      const { container } = render(<PopularGamesSection />);
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
    });
  });

  describe("fallback description", () => {
    it("uses fallback description when game has no description", () => {
      mockUseQuery.mockReturnValue([
        {
          _id: "game1",
          title: "No Description Game",
          description: null,
          level: "A1",
          slug: "no-desc-game",
          status: "published",
        },
      ]);
      render(<PopularGamesSection />);

      expect(
        screen.getByText(/practice your english skills with this interactive game/i)
      ).toBeInTheDocument();
    });
  });
});
