import { render, screen } from "@testing-library/react";
import { FeaturedPost } from "../FeaturedPost";

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

// Mock next-intl
jest.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const defaultProps = {
  slug: "test-post",
  title: "Test Post Title",
  excerpt: "This is a test excerpt for the featured post.",
  author: "John Doe",
  category: "Grammar",
};

describe("FeaturedPost", () => {
  it("renders the post title", () => {
    render(<FeaturedPost {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /test post title/i })
    ).toBeInTheDocument();
  });

  it("renders the category badge", () => {
    render(<FeaturedPost {...defaultProps} />);
    expect(screen.getByText(/grammar/i)).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<FeaturedPost {...defaultProps} />);
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  it("renders the excerpt", () => {
    render(<FeaturedPost {...defaultProps} />);
    expect(
      screen.getByText(/this is a test excerpt for the featured post/i)
    ).toBeInTheDocument();
  });

  it("renders the Read More button", () => {
    render(<FeaturedPost {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /read more/i })
    ).toBeInTheDocument();
  });

  it("links to the correct blog post URL", () => {
    render(<FeaturedPost {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/blog/test-post");
  });

  it("renders read time when provided", () => {
    render(<FeaturedPost {...defaultProps} readTimeMinutes={5} />);
    expect(screen.getByText(/5 min read/i)).toBeInTheDocument();
  });

  it("does not render read time when not provided", () => {
    render(<FeaturedPost {...defaultProps} />);
    expect(screen.queryByText(/min read/i)).not.toBeInTheDocument();
  });

  it("renders image when featuredImageUrl is provided", () => {
    render(
      <FeaturedPost {...defaultProps} featuredImageUrl="/test-image.jpg" />
    );
    const img = screen.getByRole("img", { name: /test post title/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test-image.jpg");
  });

  it("renders placeholder when no featuredImageUrl is provided", () => {
    const { container } = render(<FeaturedPost {...defaultProps} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const placeholder = container.querySelector(".bg-gradient-to-br");
    expect(placeholder).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <FeaturedPost {...defaultProps} className="custom-class" />
    );
    const article = container.querySelector("article");
    expect(article).toHaveClass("custom-class");
  });

  it("has rounded-2xl and shadow-xl classes", () => {
    const { container } = render(<FeaturedPost {...defaultProps} />);
    const article = container.querySelector("article");
    expect(article).toHaveClass("rounded-2xl");
    expect(article).toHaveClass("shadow-xl");
  });

  it("has hover scale effect class", () => {
    const { container } = render(<FeaturedPost {...defaultProps} />);
    const article = container.querySelector("article");
    expect(article).toHaveClass("hover:scale-[1.02]");
  });

  it("renders gradient overlay for image", () => {
    const { container } = render(<FeaturedPost {...defaultProps} />);
    const gradientOverlay = container.querySelector(".bg-gradient-to-t");
    expect(gradientOverlay).toBeInTheDocument();
  });
});
