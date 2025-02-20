import React from 'react';
import { render, RenderResult, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import AuthContext from '../../contexts/AuthContext';
import { LoggedUser } from '../../lib/user';
import MainComment, { MainCommentProps } from './MainComment';
import loggedUser from '../../../__tests__/fixture/loggedUser';
import comment from '../../../__tests__/fixture/comment';
import post from '../../../__tests__/fixture/post';

const onComment = jest.fn();
const onDelete = jest.fn();
const onEdit = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

const renderLayout = (
  props: Partial<MainCommentProps> = {},
  user: LoggedUser = null,
): RenderResult => {
  const defaultProps: MainCommentProps = {
    post,
    comment,
    onComment,
    onDelete,
    onEdit,
    postAuthorId: null,
    postScoutId: null,
  };

  const client = new QueryClient();

  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={{
          user,
          shouldShowLogin: false,
          showLogin: jest.fn(),
          logout: jest.fn(),
          updateUser: jest.fn(),
          tokenRefreshed: true,
        }}
      >
        <MainComment {...defaultProps} {...props} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
};

it('should show author profile image', async () => {
  renderLayout();
  const el = await screen.findByAltText(`${comment.author.username}'s profile`);
  expect(el).toHaveAttribute('src', comment.author.image);
});

it('should show author name', async () => {
  renderLayout();
  await screen.findByText(comment.author.name);
});

it('should show formatted comment date', async () => {
  renderLayout();
  await screen.findByText('Feb 10, 2017');
});

it('should show last updated comment date', async () => {
  renderLayout({
    comment: {
      ...comment,
      lastUpdatedAt: new Date(2017, 2, 10, 0, 0).toISOString(),
    },
  });
  await screen.findByText('Modified Mar 10, 2017');
});

it('should show comment content', async () => {
  renderLayout();
  await screen.findByText('my comment');
});

it('should have no subcomments', async () => {
  renderLayout();
  expect(screen.queryAllByTestId('subcomment').length).toEqual(0);
});

it('should have subcomments', async () => {
  renderLayout({
    comment: {
      ...comment,
      children: {
        pageInfo: {},
        edges: [
          {
            node: {
              ...comment,
              id: 'c2',
            },
            cursor: '',
          },
        ],
      },
    },
  });
  expect(screen.queryAllByTestId('subcomment').length).toEqual(1);
});

it('should call onComment callback', async () => {
  renderLayout();
  const el = await screen.findByLabelText('Comment');
  el.click();
  expect(onComment).toBeCalledWith(comment, 'c1');
});

it('should call onDelete callback', async () => {
  renderLayout({}, loggedUser);
  const el = await screen.findByLabelText('Options');
  el.click();
  const [, remove] = await screen.findAllByRole('menuitem');
  remove.click();
  expect(onDelete).toBeCalledWith(comment, 'c1');
});

it('should show author badge', async () => {
  renderLayout({ postAuthorId: 'u1' }, loggedUser);
  const el = await screen.findByText('Author');
  expect(el).toBeInTheDocument();
});
