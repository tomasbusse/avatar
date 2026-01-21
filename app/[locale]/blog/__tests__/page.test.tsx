import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock translations
const mockTranslations = {
  headline: "Test Blog Headline",
  subheadline: "Test blog subheadline",
  allCategories: "All Categories",
  noPosts: "No posts available",
  badge: "Blog",
};

// Mock next-intl/server
jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
  getTranslations: jest.fn(() =>
    Promise.resolve((key: keyof typeof mockTranslations) => mockTranslations[key])
  ),
}));

// Mock next-intl for client components (useLocale and useTranslations)
jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const ctaTranslations: Record<string, string> = {
      headline: "Ready to start learning?",
      subheadline: "Book your free consultation today",
      cta: "Free Consultation",
    };
    return ctaTranslations[key] || key;
  },
}));

// Mock posts data
const mockPosts = [
  {
    slug: "featured-post",
    title: "Featured Post Title",
    excerpt: "Featured post excerpt",
    author: "Author One",
    category: "Grammar",
    categoryId: "cat-1",
    featuredImageUrl: "/featured.jpg",
    publishedAt: "2024-01-15",
    readTimeMinutes: 5,
    createdAt: "2024-01-15",
  },
  {
    slug: "second-post",
    title: "Second Post Title",
    excerpt: "Second post excerpt",
    author: "Author Two",
    category: "Vocabulary",
    categoryId: "cat-2",
    featuredImageUrl: "/second.jpg",
    publishedAt: "2024-01-14",
    readTimeMinutes: 3,
    createdAt: "2024-01-14",
  },
  {
    slug: "third-post",
    title: "Third Post Title",
    excerpt: "Third post excerpt",
    author: "Author Three",
    category: "Grammar",
    categoryId: "cat-1",
    featuredImageUrl: "/third.jpg",
    publishedAt: "2024-01-13",
    readTimeMinutes: 4,
    createdAt: "2024-01-13",
  },
];

const mockCategories = [
  { _id: "cat-1", name: "Grammar", slug: "grammar" },
  { _id: "cat-2", name: "Vocabulary", slug: "vocabulary" },
];

// Mock convex/nextjs
jest.mock("convex/nextjs", () => ({
  fetchQuery: jest.fn((api: unknown) => {
    const apiPath = String(api);
    if (apiPath.includes("getBlogPosts")) {
      return Promise.resolve(mockPosts);
    }
    if (apiPath.includes("blogCategories")) {
      return Promise.resolve(mockCategories);
    }
    return Promise.resolve([]);
  }),
}));

// Mock convex/react for PopularGamesSection
jest.mock("convex/react", () => ({
  useQuery: jest.fn(() => []),
}));

// Mock API
jest.mock("@/convex/_generated/api", () => ({
  api: {
    landing: {
      getBlogPosts: "api.landing.getBlogPosts",
    },
    blogCategories: {
      list: "api.blogCategories.list",
    },
    wordGames: {
      listGames: "api.wordGames.listGames",
    },
  },
}));

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

// Import the component after mocking
import BlogPage from "../page";

describe("BlogPage", () => {
  const defaultParams = Promise.resolve({ locale: "en" });

  it("renders the BlogHero component with translated headline", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(
      screen.getByRole("heading", { name: /test blog headline/i })
    ).toBeInTheDocument();
  });

  it("renders the subheadline from translations", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(screen.getByText(/test blog subheadline/i)).toBeInTheDocument();
  });

  it("renders the FeaturedPost component with the first post", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(
      screen.getByRole("heading", { name: /featured post title/i })
    ).toBeInTheDocument();
  });

  it("renders the featured post author", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(screen.getByText(/author one/i)).toBeInTheDocument();
  });

  it("renders the PopularGamesSection", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(
      screen.getByText(/practice with interactive games/i)
    ).toBeInTheDocument();
  });

  it("renders the CategoryFilterTabs component", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    // Check for category buttons
    expect(screen.getByText(/all categories/i)).toBeInTheDocument();
  });

  it("renders the BlogContactCard component", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(
      screen.getByText(/questions\? we're here to help/i)
    ).toBeInTheDocument();
  });

  it("renders the CTASection at the bottom", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    // CTASection has a specific headline from mocked translations
    expect(screen.getByText(/ready to start learning\?/i)).toBeInTheDocument();
  });

  it("separates the featured post from other posts", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    // The featured post should appear in FeaturedPost component
    expect(
      screen.getByRole("heading", { name: /featured post title/i })
    ).toBeInTheDocument();

    // The second and third posts should appear in the grid (not as featured)
    expect(screen.getByText(/second post title/i)).toBeInTheDocument();
    expect(screen.getByText(/third post title/i)).toBeInTheDocument();
  });

  it("renders with correct section backgrounds", async () => {
    const Page = await BlogPage({ params: defaultParams });
    const { container } = render(Page);

    // Check for background classes
    const creamSections = container.querySelectorAll(".bg-sls-cream");
    expect(creamSections.length).toBeGreaterThan(0);

    const whiteSections = container.querySelectorAll(".bg-white");
    expect(whiteSections.length).toBeGreaterThan(0);
  });

  it("renders contact information in BlogContactCard", async () => {
    const Page = await BlogPage({ params: defaultParams });
    render(Page);

    expect(screen.getByText(/james@englisch-lehrer.com/i)).toBeInTheDocument();
  });
});

describe("BlogPage with empty posts", () => {
  beforeEach(() => {
    // Clear previous mock calls
    jest.clearAllMocks();
  });

  it("handles empty posts gracefully", async () => {
    // Override the mock for this specific test
    const { fetchQuery } = require("convex/nextjs");
    fetchQuery.mockImplementation((api: unknown) => {
      const apiPath = String(api);
      if (apiPath.includes("getBlogPosts")) {
        return Promise.resolve([]);
      }
      if (apiPath.includes("blogCategories")) {
        return Promise.resolve(mockCategories);
      }
      return Promise.resolve([]);
    });

    const Page = await BlogPage({ params: Promise.resolve({ locale: "en" }) });
    const { container } = render(Page);

    // Should not have the FeaturedPost section when no posts
    // The FeaturedPost article has specific classes
    const featuredArticles = container.querySelectorAll("article.group");
    expect(featuredArticles.length).toBe(0);

    // Should still render other sections
    expect(screen.getByText(/test blog headline/i)).toBeInTheDocument();
  });
});
