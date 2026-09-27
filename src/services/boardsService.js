// Re-export shim — boards logic now lives in saveService.
export {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addRecipeToBoard,
  removeRecipeFromBoard,
  boardsContaining,
  getBoardRecipes,
  encodeBoardForShare,
  decodeSharedBoard,
  buildShareUrl,
  importSharedBoard,
} from './saveService';

export { recipeKey } from './saveService';
