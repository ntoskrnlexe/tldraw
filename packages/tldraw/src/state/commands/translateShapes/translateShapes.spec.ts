/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TLDrawState } from '~state'
import { mockDocument, TLDrawStateUtils } from '~test'
import { ArrowShape, SessionType, TLDrawShapeType } from '~types'

describe('Translate command', () => {
  const tlstate = new TLDrawState()

  beforeEach(() => {
    tlstate.loadDocument(mockDocument)
  })

  describe('when no shape is selected', () => {
    it('does nothing', () => {
      const initialState = tlstate.state
      tlstate.nudge([1, 2])
      const currentState = tlstate.state

      expect(currentState).toEqual(initialState)
    })
  })

  it('does, undoes and redoes command', () => {
    tlstate.selectAll()
    tlstate.nudge([1, 2])

    expect(tlstate.getShape('rect2').point).toEqual([101, 102])

    tlstate.undo()

    expect(tlstate.getShape('rect2').point).toEqual([100, 100])

    tlstate.redo()

    expect(tlstate.getShape('rect2').point).toEqual([101, 102])
  })

  it('major nudges', () => {
    tlstate.selectAll()
    tlstate.nudge([1, 2], true)
    expect(tlstate.getShape('rect2').point).toEqual([110, 120])
  })

  describe('when nudging shapes with bindings', () => {
    it('deleted bindings if nudging shape is bound to other shapes', () => {
      tlstate
        .resetDocument()
        .createShapes(
          {
            id: 'target1',
            type: TLDrawShapeType.Rectangle,
            point: [0, 0],
            size: [100, 100],
          },
          {
            type: TLDrawShapeType.Arrow,
            id: 'arrow1',
            point: [200, 200],
          }
        )
        .select('arrow1')
        .startSession(SessionType.Arrow, [200, 200], 'start')
        .updateSession([50, 50])
        .completeSession()

      const bindingId = tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId!

      tlstate.select('arrow1').nudge([10, 10])

      expect(tlstate.getBinding(bindingId)).toBeUndefined()
      expect(tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId).toBeUndefined()

      tlstate.undo()

      expect(tlstate.getBinding(bindingId)).toBeDefined()
      expect(tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId).toBe(bindingId)

      tlstate.redo()

      expect(tlstate.getBinding(bindingId)).toBeUndefined()
      expect(tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId).toBeUndefined()
    })

    it('does not delete bindings if both bound and bound-to shapes are nudged', () => {
      tlstate
        .resetDocument()
        .createShapes(
          {
            id: 'target1',
            type: TLDrawShapeType.Rectangle,
            point: [0, 0],
            size: [100, 100],
          },
          {
            type: TLDrawShapeType.Arrow,
            id: 'arrow1',
            point: [200, 200],
          }
        )
        .select('arrow1')
        .startSession(SessionType.Arrow, [200, 200], 'start')
        .updateSession([50, 50])
        .completeSession()

      const bindingId = tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId!

      tlstate.select('arrow1', 'target1').nudge([10, 10])

      expect(tlstate.getBinding(bindingId)).toBeDefined()
      expect(tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId).toBe(bindingId)

      tlstate.undo()

      expect(tlstate.getBinding(bindingId)).toBeDefined()
      expect(tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId).toBe(bindingId)

      tlstate.redo()

      expect(tlstate.getBinding(bindingId)).toBeDefined()
      expect(tlstate.getShape<ArrowShape>('arrow1').handles.start.bindingId).toBe(bindingId)
    })
  })
})

describe('When nudging groups', () => {
  it('nudges children instead', () => {
    const tlstate = new TLDrawState()
      .loadDocument(mockDocument)
      .group(['rect1', 'rect2'], 'groupA')
      .nudge([1, 1])

    new TLDrawStateUtils(tlstate).expectShapesToBeAtPoints({
      rect1: [1, 1],
      rect2: [101, 101],
    })
  })
})