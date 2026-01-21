import { render, screen } from "@testing-library/react";
import { BlogHero } from "../BlogHero";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("BlogHero", () => {
  it("renders the default headline", () => {
    render(<BlogHero />);
    expect(
      screen.getByRole("heading", {
        name: /learn english with interactive games/i,
      })
    ).toBeInTheDocument();
  });

  it("renders a custom headline when provided", () => {
    render(<BlogHero headline="Custom Headline" />);
    expect(
      screen.getByRole("heading", { name: /custom headline/i })
    ).toBeInTheDocument();
  });

  it("renders the default subheadline", () => {
    render(<BlogHero />);
    expect(
      screen.getByText(/master grammar, expand your vocabulary/i)
    ).toBeInTheDocument();
  });

  it("renders a custom subheadline when provided", () => {
    render(<BlogHero subheadline="Custom subheadline text" />);
    expect(screen.getByText(/custom subheadline text/i)).toBeInTheDocument();
  });

  it("renders the Browse Articles button with correct link", () => {
    render(<BlogHero />);
    const browseButton = screen.getByRole("link", { name: /browse articles/i });
    expect(browseButton).toBeInTheDocument();
    expect(browseButton).toHaveAttribute("href", "/blog");
  });

  it("renders the Free Consultation button with correct link", () => {
    render(<BlogHero />);
    const consultationButton = screen.getByRole("link", {
      name: /free consultation/i,
    });
    expect(consultationButton).toBeInTheDocument();
    expect(consultationButton).toHaveAttribute("href", "/contact");
  });

  it("renders the Free Learning Resources badge", () => {
    render(<BlogHero />);
    expect(screen.getByText(/free learning resources/i)).toBeInTheDocument();
  });

  it("renders trust indicators", () => {
    render(<BlogHero />);
    expect(screen.getByText(/cambridge-aligned/i)).toBeInTheDocument();
    expect(screen.getByText(/a1-c2 levels/i)).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(<BlogHero className="custom-class" />);
    const section = container.querySelector("section");
    expect(section).toHaveClass("custom-class");
  });

  it("renders with gradient background classes", () => {
    const { container } = render(<BlogHero />);
    const gradientDiv = container.querySelector(".bg-gradient-to-br");
    expect(gradientDiv).toBeInTheDocument();
  });

  it("renders decorative elements", () => {
    const { container } = render(<BlogHero />);
    // Check for blur elements (decorative orbs)
    const blurElements = container.querySelectorAll(".blur-3xl");
    expect(blurElements.length).toBeGreaterThan(0);
  });
});
