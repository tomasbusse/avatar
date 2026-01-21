import { render, screen } from "@testing-library/react";
import { BlogContactCard } from "../BlogContactCard";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("BlogContactCard", () => {
  it("renders the default headline", () => {
    render(<BlogContactCard />);
    expect(
      screen.getByRole("heading", {
        name: /questions\? we're here to help/i,
      })
    ).toBeInTheDocument();
  });

  it("renders a custom headline when provided", () => {
    render(<BlogContactCard headline="Custom Headline" />);
    expect(
      screen.getByRole("heading", { name: /custom headline/i })
    ).toBeInTheDocument();
  });

  it("renders the default email with mailto link", () => {
    render(<BlogContactCard />);
    const emailLink = screen.getByRole("link", { name: /james@englisch-lehrer\.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:james@englisch-lehrer.com");
  });

  it("renders a custom email when provided", () => {
    render(<BlogContactCard email="test@example.com" />);
    const emailLink = screen.getByRole("link", { name: /test@example\.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:test@example.com");
  });

  it("renders the default phone with tel link", () => {
    render(<BlogContactCard />);
    const phoneLink = screen.getByRole("link", { name: /\+49 511 47 39 339/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute("href", "tel:+495114739339");
  });

  it("renders a custom phone when provided", () => {
    render(<BlogContactCard phone="+49 123 456 789" />);
    const phoneLink = screen.getByRole("link", { name: /\+49 123 456 789/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute("href", "tel:+49123456789");
  });

  it("renders the default address", () => {
    render(<BlogContactCard />);
    expect(
      screen.getByText(/im werkhof schaufelder straße 11 30167 hannover/i)
    ).toBeInTheDocument();
  });

  it("renders a custom address when provided", () => {
    render(<BlogContactCard address="123 Custom Street" />);
    expect(screen.getByText(/123 custom street/i)).toBeInTheDocument();
  });

  it("renders the CTA button with correct link", () => {
    render(<BlogContactCard />);
    const ctaButton = screen.getByRole("link", { name: /book free consultation/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute("href", "/contact");
  });

  it("renders a custom CTA when provided", () => {
    render(<BlogContactCard ctaText="Get Started" ctaLink="/start" />);
    const ctaButton = screen.getByRole("link", { name: /get started/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute("href", "/start");
  });

  it("applies custom className when provided", () => {
    const { container } = render(<BlogContactCard className="custom-class" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-class");
  });

  it("has the correct background color class", () => {
    const { container } = render(<BlogContactCard />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-sls-teal");
  });

  it("has the correct styling classes", () => {
    const { container } = render(<BlogContactCard />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("rounded-2xl");
    expect(card).toHaveClass("p-8");
    expect(card).toHaveClass("text-white");
  });
});
