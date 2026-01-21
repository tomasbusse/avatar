import { render, screen } from "@testing-library/react";
import { GamePreviewCard } from "../GamePreviewCard";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("GamePreviewCard", () => {
  const defaultProps = {
    title: "Vocabulary Match",
    description: "Match English words with their German translations",
    difficulty: "B1" as const,
    gameLink: "/games/vocabulary-match",
  };

  it("renders the game title", () => {
    render(<GamePreviewCard {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /vocabulary match/i })
    ).toBeInTheDocument();
  });

  it("renders the game description", () => {
    render(<GamePreviewCard {...defaultProps} />);
    expect(
      screen.getByText(/match english words with their german translations/i)
    ).toBeInTheDocument();
  });

  it("renders the difficulty badge with correct level", () => {
    render(<GamePreviewCard {...defaultProps} />);
    expect(screen.getByText("B1")).toBeInTheDocument();
  });

  it("renders the Play Now button with correct link", () => {
    render(<GamePreviewCard {...defaultProps} />);
    const playButton = screen.getByRole("link", { name: /play now/i });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveAttribute("href", "/games/vocabulary-match");
  });

  it("renders the Gamepad2 icon", () => {
    const { container } = render(<GamePreviewCard {...defaultProps} />);
    // lucide-react icons are rendered as SVG elements
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <GamePreviewCard {...defaultProps} className="custom-class" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-class");
  });

  it("has the correct base styling classes", () => {
    const { container } = render(<GamePreviewCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("border-2");
    expect(card).toHaveClass("border-sls-beige");
    expect(card).toHaveClass("rounded-xl");
  });

  it("has hover transition classes", () => {
    const { container } = render(<GamePreviewCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("transition-all");
    expect(card).toHaveClass("hover:border-sls-teal");
  });

  describe("difficulty level colors", () => {
    it.each([
      ["A1", "bg-green-100"],
      ["A2", "bg-emerald-100"],
      ["B1", "bg-yellow-100"],
      ["B2", "bg-orange-100"],
      ["C1", "bg-red-100"],
      ["C2", "bg-purple-100"],
    ] as const)("renders %s with correct color class", (level, expectedClass) => {
      render(
        <GamePreviewCard
          {...defaultProps}
          difficulty={level}
        />
      );
      const badge = screen.getByText(level);
      expect(badge).toHaveClass(expectedClass);
    });
  });

  it("renders with different props", () => {
    render(
      <GamePreviewCard
        title="Grammar Challenge"
        description="Test your grammar skills"
        difficulty="C2"
        gameLink="/games/grammar"
      />
    );
    expect(
      screen.getByRole("heading", { name: /grammar challenge/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/test your grammar skills/i)).toBeInTheDocument();
    expect(screen.getByText("C2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /play now/i })).toHaveAttribute(
      "href",
      "/games/grammar"
    );
  });

  it("truncates long titles", () => {
    const { container } = render(
      <GamePreviewCard
        {...defaultProps}
        title="This is a very long game title that should be truncated"
      />
    );
    const heading = container.querySelector("h3");
    expect(heading).toHaveClass("truncate");
  });

  it("limits description to 2 lines", () => {
    const { container } = render(
      <GamePreviewCard
        {...defaultProps}
        description="This is a very long description that goes on and on"
      />
    );
    const description = container.querySelector("p");
    expect(description).toHaveClass("line-clamp-2");
  });
});
