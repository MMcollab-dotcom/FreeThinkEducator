<script setup lang="ts">
import * as d3 from 'd3'
import { reactive, ref } from 'vue'
// @ts-ignore
import { v4 } from 'uuid'
const activateQuestionSuggestion = true

// Function to clean body text for display (removes BUTTON: and SPECIAL: prefixes)
function cleanBodyForDisplay(body: string): string {
  return body.split('\n')
    .filter(line => {
      const trimmedLine = line //.trim()
      // Filter out lines that start with BUTTON: or SPECIAL: - these should only appear as buttons
      return !trimmedLine.startsWith('BUTTON:') && !trimmedLine.startsWith('SPECIAL:')
    })
    .join('\n')
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  index: number
  id: string
  fx: number | null
  fy: number | null
  nodeType: string
  body: string
  bodyCompleted: boolean
  questions: string[]
  customQuestion?: string
}

interface Link {
  id: string
  index: number
  source: Node
  target: Node
}

let currNodeIndex = 0
let currLinkIndex = 0
const nodes: Node[] = reactive([
  {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    index: currNodeIndex++,
    fx: null,
    fy: null,
    nodeType: 'start',
    id: 'id1',
    body: '',
    bodyCompleted: false,
    questions: []
  }
])
const links: Link[] = reactive([])

const linkStrength = 0.1
const nodeStrength = -100

const simulation = ForceGraph(
  { nodes, links },
  {
    invalidation: new Promise(() => {}) // a promise to stop the simulation when the cell is re-run
  }
)

function ForceGraph(
  {
    nodes, // an iterable of node objects (typically [{id}, …])
    links // an iterable of link objects (typically [{source, target}, …])
  }: any,
  {
    invalidation // when this promise resolves, stop the simulation
  } = {} as any
) {
  const forceLink = d3.forceLink(links)
  forceLink.strength(linkStrength)

  const forceNode = d3.forceManyBody()
  forceNode.strength(nodeStrength)

  const simulation = d3
    .forceSimulation(nodes)
    // .force("collide", d3.forceCollide(500).strength(1000))
    .force('link', forceLink)
    .force('charge', forceNode)
    .force('center', d3.forceCenter().strength(0.05))
  simulation.alphaTarget(0.5)
  // .alphaTarget(0.1)
  // .alphaMin(0.01)
  // .alphaDecay(0.1)

  if (invalidation != null) invalidation.then(() => simulation.stop())

  // return Object.assign(svg.node(), { scales: { color } })
  return simulation
}

let dragElement = null as any
let dragOffset = null as any
function dragStart(node: any, event: MouseEvent) {
  simulation.alphaTarget(0.3)
  simulation.restart()
  dragElement = node
  dragOffset = { x: node.x - event.clientX, y: node.y - event.clientY }
  dragged(event)
}

function dragged(event: MouseEvent) {
  if (!dragElement || !dragOffset) return
  dragElement.fx = event.clientX + dragOffset.x
  dragElement.fy = event.clientY + dragOffset.y
}

function dragEnd() {
  if (!dragElement) return
  simulation.alphaTarget(0)
  dragElement.fx = null
  dragElement.fy = null
  dragElement = null
}

const global_idx = ref(0)

async function logStreamedText(
  url: string,
  prompt: string,
  deltaHandler: (delta: string) => void,
  doneHandler: () => void
): Promise<void> {
  try {
    prompt = `${global_idx.value} ` + prompt
    console.log('=== Frontend API Call ===')
    console.log('Original prompt:', prompt)
    console.log('Global index:', global_idx.value)
    global_idx.value += 1
    console.log('Making fetch request to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('No ReadableStream found in the response')
    }

    const decoder = new TextDecoder('utf-8')

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      console.log( chunk )
      deltaHandler(chunk)
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`)
    doneHandler()
  }

  doneHandler()
}

function wiggle(val: number) {
  return val + Math.random() * val - val / 2
}

// const url = 'free-think-educator-ovgsq8iq6-maomaos-projects-9ea2e78d.vercel.app'
const url = 'http://localhost:3001/api/hardcoded_handler' // Force local server
console.log('Using API URL:', url)
// logStreamedText(url, '100 words about love')
function createQuestions(statementNode: Node, questionStump: string | undefined = undefined) {
  if (statementNode.nodeType === 'start' && statementNode.body == '') return
  const force = getForceForNextNode(statementNode)
  const node = reactive({
    x: wiggle(statementNode.x) + force.vx,
    y: wiggle(statementNode.y) + force.vy,
    vx: 0,
    vy: 0,
    index: currNodeIndex++,
    fx: null,
    fy: null,
    nodeType: 'question',
    id: v4(),
    body: '',
    bodyCompleted: false,
    questions: [] as string[]
  })

  insertNode(node)
  insertLink({ id: 'l1', index: currLinkIndex++, source: statementNode, target: node })

  const existingQuestions = links
    .filter(
      (link) =>
        link.source === statementNode &&
        link.target.nodeType === 'answer' &&
        link.target.bodyCompleted
    )
    .map((link) => link.target.body)
    .join('\n')

  let prompt = questionStump ? 
    `TOPIC_START\n${statementNode.body}\nTOPIC_END\nQUESTION_START${questionStump}QUESTION_END\nRefine the question in between QUESTION_START and QUESTION_END in a precise and consice way.`
    :`TOPIC_START\n${statementNode.body}\nTOPIC_END\nEXISTING_QUESTIONS_START${existingQuestions}EXISTING_QUESTIONS_END\nCreate a new, imaginative, non-obvious, question about the topic.`

  logStreamedText(
    url,
    prompt,
    (delta) => {
      node.body += delta
    },
    () => {
      node.bodyCompleted = true

      // Parse the body content for buttons with prefix system
      console.log('=== PARSING BODY FOR BUTTONS (createQuestions) ===')
      console.log('Body content:', node.body)
      const bodyLines = node.body.split('\n')
      console.log('Body lines:', bodyLines)
      
      const buttons: string[] = []
      
      for (const line of bodyLines) {
        const trimmedLine = line //.trim()
        if (trimmedLine.startsWith('BUTTON:')) {
          // Grey button
          const buttonText = trimmedLine.replace('BUTTON:', '')
          if (buttonText) {
            buttons.push(buttonText)
            console.log('Found grey button:', buttonText)
          }
        } else if (trimmedLine.startsWith('SPECIAL:')) {
          // Yellow special button  
          const buttonText = trimmedLine.replace('SPECIAL:', '')
          if (buttonText) {
            buttons.push('SPECIAL:' + buttonText)
            console.log('Found special button:', buttonText)
          }
        }
      }
      
      console.log('All buttons found:', buttons)
      node.questions = buttons

      if (!activateQuestionSuggestion) return

      // Generate questions

      let questions = ''

      logStreamedText(
        url,
        `STATEMENT_START\n${node.body}\nSTATEMENT_END\nCreate a list of three inspirational questions for this statement. Questions must be formulated short and precise using only few words.`,
        (delta) => {
          questions += delta
          node.questions = parseMarkdownList(questions)
        },
        () => {
        }
      )
    }
  )
}

function insertNode(node: Node | null = null) {
  if (node) {
    nodes.push(node)
  }
  simulation.alphaTarget(0.1)
  simulation.alphaMin(0.01)
  simulation.restart()
  const forceNode = d3.forceManyBody().distanceMax(1500)
  forceNode.strength(nodeStrength)
  simulation.force('charge', forceNode)
}

function insertLink(link: Link | null = null) {
  if (link) {
    links.push(link)
  }
  simulation.restart()
  const forceLink = d3.forceLink(links).distance(400)
  forceLink.strength(linkStrength)
  simulation.force('link', forceLink)
  // simulation.alphaTarget(0.3).restart()
}

function getForceForNextNode(prevNode: Node) {
  const possibleRadius = 100
  const getValInSquare = (val: number) => {
    return val + Math.random() * possibleRadius * 2 - possibleRadius
  }

  let vx = 0
  let vy = 0

  const prevPrevNode = links.find((link) => link.target === prevNode)?.source
  if (prevPrevNode === undefined) {
    vx = getValInSquare(prevNode.x)
    vy = getValInSquare(prevNode.y)
  } else {
    vx = prevNode.x - prevPrevNode.x
    vy = prevNode.y - prevPrevNode.y
  }

  const normalize = ({ vx, vy }: { vx: number; vy: number }) => {
    const norm = Math.sqrt(Math.pow(vx, 2) + Math.pow(vx, 2))
    return { vx: vx / norm, vy: vy / norm }
  }

  const force = normalize({ vx, vy })

  const multiplier = 100
  force.vx *= multiplier
  force.vy *= multiplier
  return force
}

function parseMarkdownList(markdownList: string): string[] {
  const lines = markdownList.split(/\r?\n/);
  const listItems: string[] = [];

  let listItem: string | null = null;

  for (const line of lines) {
    const match = line.match(/^(\s*)(?:[-*+]|[0-9]+[.)])\s+(.*)$/);
    if (match) {
      if (listItem) {
        listItems.push(listItem.replace(/^"(.*)"$/, '$1'));
      }
      listItem = match[2];
    } else if (listItem !== null) {
      listItem += ' ' + line //.trim();
    }
  }

  if (listItem) {
    listItems.push(listItem.replace(/^"(.*)"$/, '$1'));
  }

  return listItems;
}


function createAnswers(questionNode: Node) {
  const force = getForceForNextNode(questionNode)
  const node = reactive({
    x: wiggle(questionNode.x) + force.vx,
    y: wiggle(questionNode.y) + force.vy,
    vx: 0,
    vy: 0,
    index: currNodeIndex++,
    fx: null,
    fy: null,
    nodeType: 'answer',
    id: v4(),
    body: '',
    bodyCompleted: false,
    questions: [] as string[]
  })

  insertNode(node)
  insertLink({ id: 'l1', index: currLinkIndex++, source: questionNode, target: node })

  const existingAnswers = links
    .filter(
      (link) =>
        link.source === questionNode &&
        link.target.nodeType === 'answer' &&
        link.target.bodyCompleted
    )
    .map((link) => link.target.body)
    .join('\n')

  logStreamedText(
    url,
    questionNode.nodeType === 'start' ? 
      '' : 
      `QUESTION_START\n${questionNode.body}\nQUESTION_END\nEXISTING_ANSWERS_START${existingAnswers}EXISTING_ANSWERS_END\nCreate an informative and precise answer about the the content in between QUESTION_START and QUESTION_END. The answer must be concise and inspirational and open possibilities for further discussions. DO NOT raise questions back in the end!`,
    (delta) => {
      node.body += delta
      console.log(node.body)
    },
    () => {
      console.log('=== COMPLETION HANDLER CALLED (createAnswers) ===');
      console.log('Final node.body:', node.body);
      node.bodyCompleted = true

      // Parse the body content for buttons with prefix system
      console.log('=== PARSING BODY FOR BUTTONS (createAnswers) ===')
      console.log('Body content:', node.body)
      const bodyLines = node.body.split('\n')
      console.log('Body lines:', bodyLines)
      
      const buttons: string[] = []
      
      for (const line of bodyLines) {
        const trimmedLine = line //.trim()
        if (trimmedLine.startsWith('BUTTON:')) {
          // Grey button
          const buttonText = trimmedLine.replace('BUTTON:', '')
          if (buttonText) {
            buttons.push(buttonText)
            console.log('Found grey button:', buttonText)
          }
        } else if (trimmedLine.startsWith('SPECIAL:')) {
          // Yellow special button  
          const buttonText = trimmedLine.replace('SPECIAL:', '')
          if (buttonText) {
            buttons.push('SPECIAL:' + buttonText)
            console.log('Found special button:', buttonText)
          }
        }
      }
      
      console.log('All buttons found:', buttons)
      node.questions = buttons

      // Check if this is hardcoded content (has prefixed buttons) - skip AI generation for hardcoded content
      const hasHardcodedContent = buttons.length > 0

      if (!activateQuestionSuggestion || hasHardcodedContent) return

      // Generate questions

      let questions = ''

      logStreamedText(
        url,
        `STATEMENT_START\n${node.body}\nSTATEMENT_END\nCreate a list of three inspirational questions for this statement. Questions must be formulated short and precise using only few words.`,
        (delta) => {
          questions += delta
          node.questions = parseMarkdownList(questions)
        },
        () => {
        }
      )
    }
  )
}

function handleGenerationInvocation(node: Node) {
  console.log('=== handleGenerationInvocation called ===')
  console.log('Node type:', node.nodeType, 'Body:', node.body)
  
  if (node.nodeType === 'start') {
    console.log('Start node - using hardcoded content')
    createAnswers(node)
  } else if (node.nodeType === 'question') {
    console.log('Calling createAnswers')
    createAnswers(node)
  } else if (node.nodeType === 'special') {
    console.log('Special node - no generation needed')
    // Special nodes use hardcoded content, no generation needed
  } else {
    console.log('Calling createQuestions') 
    createQuestions(node)
  }
}

const panX = ref(0)
const panY = ref(0)

let panOffset = null as any
function startPan(event: MouseEvent) {
  if (panOffset) return
  panOffset = { x: panX.value - event.clientX, y: panY.value - event.clientY }
  pan(event)
}

function endPan(event: MouseEvent) {
  if (!panOffset) return
  pan(event)
  panOffset = null
}

function pan(event: MouseEvent) {
  if (!panOffset) return
  panX.value = event.clientX + panOffset.x
  panY.value = event.clientY + panOffset.y
}

/**
 * This event handler takes care of zoom and pan with the trackpad and the scroll wheel.
 *
 */
function handleBackgroundScroll(e: WheelEvent) {
  // This prevents the browser from scrolling/zooming the entire DOM
  e.preventDefault()

  const zooming = e.ctrlKey || e.metaKey
  if (zooming) {
    return
  } else {
    panX.value -= e.deltaX
    panY.value -= e.deltaY
  }
}
const demoNotificationIsVisible = ref(false)

setTimeout(() => {
  demoNotificationIsVisible.value = true
}, 700)
function resetSubtree(node: Node) {
  if (node.nodeType !== 'start') return
  if (node.bodyCompleted) return

  // Add all outgoing edges to the queue
  const queue: Link[] = [...links.filter((l) => l.source === node)]

  // Will hold all found children
  const foundChildren: Node[] = []

  // Will hold all found links
  const foundLinks: Link[] = []

  while (queue.length > 0) {
    // The first link in the queue
    const link = queue.shift()!
    foundLinks.push(link)

    // The child is the target of that link
    const child = link.target
    foundChildren.push(child)

    // Add all outgoing edges from that child to the list.
    queue.push(...links.filter((l) => l.source === child))
  }

  foundLinks.forEach((l) => {
    links.splice(links.indexOf(l), 1)
  })

  foundChildren.forEach((c) => {
    nodes.splice(nodes.indexOf(c), 1)
  })

  insertLink()
  insertNode()
}

function createPointedQuestion(node: Node, question?: string) {
  let q = question ?? '';
  
  // Check if this is a special hardcoded button (starts with SPECIAL:)
  if (q.startsWith('SPECIAL:')) {
    const specialKey = q.replace('SPECIAL:', '');
    createSpecialContent(node, specialKey);
    return;
  }
  
  // Check if this is a regular button from hardcoded content that should navigate to a predefined response
  const predefinedButtons = [
    "RNN: recurrent neural networks       ",
    "LSTM: long short-term memory networks      ", 
    "Transformers: attention-based models     ",
    "Continue conversation",
    "More details",
    "Send reply",
    "Send reply "
  ];
  
  if (predefinedButtons.includes(q)) {
    createHardcodedResponse(node, q);
    return;
  }
  
  createQuestions(node, q.includes('Free Thinker') ? undefined : question)
}

function createSpecialContent(parentNode: Node, specialKey: string) {
  const force = getForceForNextNode(parentNode)
  const node = reactive({
    x: wiggle(parentNode.x) + force.vx,
    y: wiggle(parentNode.y) + force.vy,
    vx: 0,
    vy: 0,
    index: currNodeIndex++,
    fx: null,
    fy: null,
    nodeType: 'special',
    id: v4(),
    body: '',
    bodyCompleted: false,
    questions: [] as string[]
  })

  insertNode(node)
  insertLink({ id: 'l1', index: currLinkIndex++, source: parentNode, target: node })

  // Request specific hardcoded content
  logStreamedText(
    url,
    `SPECIAL_CONTENT_REQUEST:${specialKey}`,
    (delta) => {
      node.body += delta
    },
    () => {
      // Parse the body content for buttons with prefix system
      console.log('=== PARSING BODY FOR BUTTONS (createSpecialContent) ===')
      console.log('Body content:', node.body)
      const bodyLines = node.body.split('\n')
      console.log('Body lines:', bodyLines)
      
      const buttons: string[] = []
      
      for (const line of bodyLines) {
        const trimmedLine = line //.trim()
        if (trimmedLine.startsWith('BUTTON:')) {
          // Grey button
          const buttonText = trimmedLine.replace('BUTTON:', '')
          if (buttonText) {
            buttons.push(buttonText)
            console.log('Found grey button:', buttonText)
          }
        } else if (trimmedLine.startsWith('SPECIAL:')) {
          // Yellow special button  
          const buttonText = trimmedLine.replace('SPECIAL:', '')
          if (buttonText) {
            buttons.push('SPECIAL:' + buttonText)
            console.log('Found special button:', buttonText)
          }
        }
      }
      
      console.log('All buttons found:', buttons)
      node.questions = buttons
      node.bodyCompleted = true
    }
  )
}

function createHardcodedResponse(parentNode: Node, buttonText: string) {
  const force = getForceForNextNode(parentNode)
  const node = reactive({
    x: wiggle(parentNode.x) + force.vx,
    y: wiggle(parentNode.y) + force.vy,
    vx: 0,
    vy: 0,
    index: currNodeIndex++,
    fx: null,
    fy: null,
    nodeType: 'answer',
    id: v4(),
    body: '',
    bodyCompleted: false,
    questions: [] as string[]
  })

  insertNode(node)
  insertLink({ id: 'l1', index: currLinkIndex++, source: parentNode, target: node })

  console.log('=== FRONTEND BUTTON NAVIGATION DEBUG ===');
  console.log('Button clicked:', buttonText);

  // Request predefined response for this button
  logStreamedText(
    url,
    `BUTTON_NAVIGATION:${buttonText}`,
    (delta) => {
      node.body += delta
    },
    () => {
      console.log('=== FRONTEND COMPLETION DEBUG ===');
      console.log('Final body:', node.body);
      
      // Parse the completed content for buttons with prefix system
      const content = node.body;
      console.log('Parsing content for buttons:', content);
      
      // Split content into lines and look for buttons with prefixes
      const lines = content.split('\n');
      const buttons: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line //.trim()
        if (trimmedLine.startsWith('BUTTON:')) {
          // Grey button
          const buttonText = trimmedLine.replace('BUTTON:', '')
          if (buttonText) {
            buttons.push(buttonText)
            console.log('Found grey button:', buttonText)
          }
        } else if (trimmedLine.startsWith('SPECIAL:')) {
          // Yellow special button  
          const buttonText = trimmedLine.replace('SPECIAL:', '')
          if (buttonText) {
            buttons.push('SPECIAL:' + buttonText)
            console.log('Found special button:', buttonText)
          }
        }
      }
      
      console.log('All buttons found:', buttons);
      node.questions = buttons;
      node.bodyCompleted = true
    }
  )
}

function createSpecialNode(parentNode: Node) {
  const force = getForceForNextNode(parentNode)
  const node = reactive({
    x: wiggle(parentNode.x) + force.vx,
    y: wiggle(parentNode.y) + force.vy,
    vx: 0,
    vy: 0,
    index: currNodeIndex++,
    fx: null,
    fy: null,
    nodeType: 'special',
    id: v4(),
    body: '',
    bodyCompleted: false,
    questions: [] as string[]
  })

  insertNode(node)
  insertLink({ id: 'l1', index: currLinkIndex++, source: parentNode, target: node })

  // Use hardcoded content with a special marker for the backend
  logStreamedText(
    url,
    `SPECIAL_NODE_REQUEST`,
    (delta) => {
      node.body += delta
    },
    () => {
      node.bodyCompleted = true
    }
  )
}

</script>

<template>
  <div
    class="fixed inset-0 bg-gradient-to-tr from-gray-950 to-gray-700"
    @mousemove="
      dragged($event);
      pan($event)
    "
    @mouseup="
      dragEnd();
      endPan($event)
    "
    @mouseleave="
      dragEnd();
      endPan($event)
    "
    @mousedown="startPan($event)"
    @wheel="handleBackgroundScroll"
  >
    <svg v-for="link in links" :key="JSON.stringify(link)" class="absolute w-full h-full">
      <line
        class="translate-x-1/2 translate-y-1/2"
        :x1="link.source.x + panX"
        :y1="link.source.y + panY"
        :x2="link.target.x + panX"
        :y2="link.target.y + panY"
        stroke="white"
        stroke-width="2"
      />
    </svg>
    <div class="absolute w-full h-full" :style="{ transform: `translate(${panX}px, ${panY}px)` }">
      <div class="absolute inset-0 translate-x-1/2 translate-y-1/2">
        <div
          v-for="node in nodes"
          @dblclick="handleGenerationInvocation(node)"
          @mousedown.stop="dragStart(node, $event)"
          :key="node.id"
          class="absolute p-4 rounded-md shadow-lg w-64 cursor-pointer ring"
          :class="{
            'select-none': dragElement !== null,
            'bg-blue-200/100 ring-blue-300 text-blue-900': node.nodeType === 'question',
            'bg-white ring-gray-200 text-black': node.nodeType === 'answer',
            'bg-yellow-200 ring-yellow-300 text-yellow-900': node.nodeType === 'special',
            'w-[380px] bg-purple-200 ring-purple-300  ': node.nodeType === 'start',
            'font-medium text-purple-900': node.nodeType === 'start' && node.body !== ''
          }"
          :style="{ transform: `translate(calc(${node.x}px - 50%), calc(${node.y}px - 50%))` }"
        >
          <textarea
            class="w-full bg-inherit text-inherit placeholder-purple-500 focus:outline-none resize-none min-h-[70px]"
            v-if="node.nodeType === 'start'"
            v-model="node.body"
            placeholder="Enter a topic and questions to challenge the AI."
            @keydown="node.bodyCompleted = false"
            @keyup.enter="
              resetSubtree(node);
              createAnswers(node)
              node.bodyCompleted = true
            "
            @dblclick.stop="
              resetSubtree(node);
              createAnswers(node)
              node.bodyCompleted = true
            "
          />
          <div v-else>
            <div style="white-space: pre-wrap">{{ cleanBodyForDisplay(node.body) }}</div>
            <!-- Add input field for answer nodes -->
            <div class="flex mt-4 w-full flex-wrap gap-2" v-if="(node.questions ?? []).length > 0">
              <button
                @click.stop="createPointedQuestion(node, item)"
                :class="item.startsWith('SPECIAL:') ? 
                  'bg-yellow-300 rounded-md px-2 py-1 text-yellow-800 text-xs hover:bg-yellow-400 font-semibold' : 
                  'bg-gray-200 rounded-md px-2 py-1 text-gray-600 text-xs hover:bg-gray-300'"
                v-for="item in (node.questions ?? [])"
                :key="item"
              >
                {{ item.startsWith('SPECIAL:') ? item.replace('SPECIAL:', '') : item }}
              </button>
            </div>
            <!-- User input box for all non-start nodes -->
            <div class="flex mt-4 w-full flex-wrap gap-2" v-if="node.nodeType != 'start'">
              <input
                class="bg-gray-200 rounded-md px-2 py-1 text-gray-600 text-xs hover:bg-gray-300 flex-1"
                v-model="node.customQuestion"
                type="text"
                placeholder="User input"
                @keyup.enter="
                  createPointedQuestion(node, node.customQuestion);
                  node.customQuestion = ''
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fixed inset-0 z-50 flex justify-between pointer-events-none">
      <!-- Need -->
      <div></div>
      <!-- Notification-wrapper -->
      <div
        class="p-4 transition-all transform"
        :class="{ 'translate-x-full': !demoNotificationIsVisible }"
      >
        <div
          class="bg-white rounded-md shadow-2xl p-6 w-full max-w-sm relative pointer-events-auto ring-1 ring-gray-200"
          :class="{}"
        >
          <div class="absolute top-3 right-3">
            <button class="w-5 h-5 text-gray-400" @click="demoNotificationIsVisible = false">
              <p>X</p>
            </button>
          </div>
          <h1 class="text-lg font-bold mb-3">Welcome to Inspirational Thinker!</h1>
          <p class="mb-3">
            Enter a topic, a subject or a field that you want to explore. Raise a question if necessary. Then, press enter or double click the card.
          </p>
          <p class="mb-3">
            Each time you double-click something, Free Thinker will think about that topic, give you related informations and raise questions to give you inspirations. Try it out!
          </p>
          <p class="text-gray-400">
            Note: This app does not store your information, but
            <a href="https://openai.com/policies/privacy-policy">OpenAI might</a>. Please do not
            enter personal information.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.translate-x-notification {
  --tw-translate-x: 31rem;
}
</style>
