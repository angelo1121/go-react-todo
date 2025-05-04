import React from 'react'
import { Flex, IconButton, Spinner, Stack, Text, ToastId, useToast } from "@chakra-ui/react";
import TodoItem from "./TodoItem";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BASE_URL } from "../App";
import { useEffect, useState } from "react";
import { useToastContext } from "../providers/ToastProvider";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { MdDragHandle } from "react-icons/md";

export type Todo = {
  id: number;
  body: string;
  completed: boolean;
}

const fetchTodos = async () => {
  const response = await fetch(`${BASE_URL}/todos`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data || [];
}

const updateTodoOrderService = async (payload: {id: number}[]) => {
  const response = await fetch(`${BASE_URL}/todos/order`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

const TodoList = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { addToast } = useToastContext();
  const toastIdRef = React.useRef<ToastId>();
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);

  const { data: todos, error, isError, isLoading } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  useEffect(() => {
    if (isError) {
      addToast('Error', 'error', {
        description: error.message,
      });
    }
  }, [addToast, error?.message, isError]);

  useEffect(() => {
    if (todos) {
      setLocalTodos(todos);
    }
  }, [todos]);

  const editTodo = (updatedTodo: Todo) => {
    queryClient.setQueryData(['todos'], (oldTodos: Todo[]) => {
      return oldTodos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)
    });
  }

  const removeTodo = (id: number) => {
    queryClient.setQueryData(['todos'], (oldTodos: Todo[]) => {
      return oldTodos.filter(todo => todo.id !== id)
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination?.index) return;

    const newTodos = Array.from(localTodos);
    const [reorderedItem] = newTodos.splice(result.source.index, 1);
    newTodos.splice(result.destination.index, 0, reorderedItem);
    setLocalTodos(newTodos);

    toastIdRef.current = addToast("Updating Todo List", "loading", { isClosable: false });
    updateTodoOrder(newTodos.map(todo => ({ id: todo.id })));
  };

  const { mutate: updateTodoOrder, isPending: isUpdatingOrder } = useMutation({
    mutationKey: ["updateTodoOrder"],
    mutationFn: updateTodoOrderService,
    onSuccess: () => {
      queryClient.setQueryData(['todos'], localTodos);
      // addToast('Todo List Updated', 'success');
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, {
          title: "Todo List Updated",
          status: "success",
          isClosable: true,
        })
      }
    },
    onError: (error) => {
      console.log(error);
      const todos = queryClient.getQueryData<Todo[]>(['todos']);
      if (todos) {
        setLocalTodos(todos);
      }
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, {
          title: "Error",
          status: "error",
          description: error.message,
          isClosable: true,
        })
      }
    }
  })

  return (
    <>
      <Text fontSize={"4xl"} textTransform={"uppercase"} fontWeight={"bold"} textAlign={"center"} my={2}
        bgGradient='linear(to-l, #0b85f8, #00ffff)'
        bgClip='text'
      >
        Today's Tasks
      </Text>
      {error && (
        <Text fontSize={"xl"} textAlign={"center"} color={"red.500"}>
          Error: {error.message}
        </Text>
      )}
      {isLoading && (
        <Flex justifyContent={"center"} my={4}>
          <Spinner size={"xl"} />
        </Flex>
      )}
      {!isLoading && todos?.length === 0 && (
        <Stack alignItems={"center"} gap='3'>
          <Text fontSize={"xl"} textAlign={"center"} color={"gray.500"}>
            All tasks completed! 🤞
          </Text>
          <img src='/go.png' alt='Go logo' width={70} height={70} />
        </Stack>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>

        <Droppable droppableId="droppable" isDropDisabled={isUpdatingOrder}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <Stack gap={0}>
                {localTodos?.map((todo, index) => (
                  <Draggable key={`todo-${todo.id}`} draggableId={`todo-${todo.id}`} index={index} disableInteractiveElementBlocking={true} isDragDisabled={isUpdatingOrder}>
                    {(provided) => (
                      <Flex
                        key={todo.id}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          marginBottom: '16px',
                          ...provided.draggableProps.style,
                        }}
                      >
                        <IconButton
                          aria-label="Drag handle"
                          icon={<MdDragHandle />}
                          {...provided.dragHandleProps} // Attach dragHandleProps to the icon
                          variant="ghost"
                          mr={2}
                        />
                        <TodoItem
                          todo={todo}
                          removeTodo={removeTodo}
                          editTodo={editTodo}
                        />
                      </Flex>

                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};
export default TodoList;
